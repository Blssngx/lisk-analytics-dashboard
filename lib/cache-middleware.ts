/**
 * Cache middleware and utility functions for Next.js API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { CACHE_TTL, CacheService } from "./services/cache-service";

export interface CacheOptions {
	ttl?: number;
	keyGenerator?: (req: NextRequest, params?: any) => string;
	skipCache?: boolean;
}

/**
 * Higher-order function to add caching to API route handlers
 */
export function withCache(
	handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
	cacheKey: string,
	options: CacheOptions = {},
) {
	return async (req: NextRequest, context?: { params: Promise<any> }) => {
		const { ttl = CACHE_TTL.MEDIUM, keyGenerator, skipCache = false } = options;

		if (skipCache) {
			return handler(req, context?.params ? await context.params : undefined);
		}

		try {
			// Generate cache key
			const params = context?.params ? await context.params : undefined;
			let finalCacheKey: string;
			if (keyGenerator) {
				finalCacheKey = keyGenerator(req, params);
			} else {
				const identifierPart = params ? Object.values(params).join(":") : "default";
				finalCacheKey = `${cacheKey}:${identifierPart}`;
			}

			// Try to get from cache first
			const [prefix, identifier] = finalCacheKey.split(":", 2);
			const cachedData = await CacheService.get(prefix, identifier || "default");

			if (cachedData) {
				console.log(`📖 Cache hit for: ${finalCacheKey}`);
				return NextResponse.json(cachedData);
			}

			// Execute handler if cache miss
			console.log(`📭 Cache miss for: ${finalCacheKey}`);
			const response = await handler(req, params);

			// Cache the response if it's successful
			if (response.status === 200) {
				try {
					const responseData = await response.clone().json();
					await CacheService.set(prefix, identifier || "default", responseData, ttl);
					console.log(`💾 Cached response for: ${finalCacheKey}`);
				} catch (error) {
					console.warn("Failed to cache response:", error);
				}
			}

			return response;
		} catch (error) {
			console.error("Cache middleware error:", error);
			// Fallback to handler without caching
			return handler(req, context?.params ? await context.params : undefined);
		}
	};
}

/**
 * Cache warmer utility for preloading frequently accessed data
 */
export class CacheWarmer {
	private static readonly warmupTasks: Map<string, () => Promise<void>> = new Map();

	static registerWarmupTask(key: string, task: () => Promise<void>) {
		this.warmupTasks.set(key, task);
	}

	static async warmupCache(keys?: string[]) {
		const tasksToRun = keys
			? Array.from(this.warmupTasks.entries()).filter(([key]) => keys.includes(key))
			: Array.from(this.warmupTasks.entries());

		console.log(`🔥 Warming up ${tasksToRun.length} cache entries...`);

		const results = await Promise.allSettled(
			tasksToRun.map(async ([key, task]) => {
				try {
					await task();
					console.log(`✅ Warmed up cache for: ${key}`);
				} catch (error) {
					console.error(`❌ Failed to warm up cache for ${key}:`, error);
				}
			}),
		);

		const successful = results.filter((r) => r.status === "fulfilled").length;
		console.log(`🔥 Cache warmup completed: ${successful}/${tasksToRun.length} successful`);
	}
}

/**
 * Cache invalidation utility
 */
export class CacheInvalidator {
	/**
	 * Invalidate cache when data is updated
	 */
	static async invalidateOnDataUpdate(
		tokenId: string,
		dataType: "holders" | "metrics" | "payments" | "wallets" | "all",
	) {
		try {
			if (dataType === "all") {
				await CacheService.invalidateTokenCaches(tokenId);
			} else {
				switch (dataType) {
					case "holders":
						await CacheService.invalidateTokenHolders(tokenId);
						break;
					case "metrics":
						await CacheService.invalidateTokenMetrics(tokenId);
						break;
					case "payments":
						await CacheService.invalidateTokenPayments(tokenId);
						break;
					case "wallets":
						await CacheService.invalidateTokenWallets(tokenId);
						break;
				}
			}
			console.log(`🧹 Invalidated ${dataType} cache for token: ${tokenId}`);
		} catch (error) {
			console.error(`Failed to invalidate ${dataType} cache for token ${tokenId}:`, error);
		}
	}

	/**
	 * Scheduled cache invalidation (useful for stale data cleanup)
	 */
	static startScheduledInvalidation(intervalMs: number = 30 * 60 * 1000) {
		// 30 minutes
		setInterval(async () => {
			console.log("🧹 Running scheduled cache cleanup...");
			try {
				// Only invalidate very old cache entries
				await CacheService.invalidateAllCaches();
			} catch (error) {
				console.error("Scheduled cache invalidation failed:", error);
			}
		}, intervalMs);
	}
}

/**
 * Cache monitoring and metrics
 */
export class CacheMonitor {
	private static metrics = {
		hits: 0,
		misses: 0,
		errors: 0,
		lastReset: Date.now(),
	};

	static recordHit() {
		this.metrics.hits++;
	}

	static recordMiss() {
		this.metrics.misses++;
	}

	static recordError() {
		this.metrics.errors++;
	}

	static getMetrics() {
		const uptime = Date.now() - this.metrics.lastReset;
		const total = this.metrics.hits + this.metrics.misses;
		const hitRate = total > 0 ? ((this.metrics.hits / total) * 100).toFixed(2) : "0";

		return {
			...this.metrics,
			hitRate: `${hitRate}%`,
			uptime: `${Math.round(uptime / 1000)}s`,
			total,
		};
	}

	static resetMetrics() {
		this.metrics = {
			hits: 0,
			misses: 0,
			errors: 0,
			lastReset: Date.now(),
		};
	}
}

/**
 * Utility for handling cache failures gracefully
 */
export async function withCacheFallback<T>(
	cacheOperation: () => Promise<T | null>,
	fallbackOperation: () => Promise<T>,
	cacheSetOperation?: (data: T) => Promise<void>,
): Promise<T> {
	try {
		const cachedResult = await cacheOperation();
		if (cachedResult !== null) {
			CacheMonitor.recordHit();
			return cachedResult;
		}
	} catch (error) {
		console.warn("Cache operation failed, falling back to database:", error);
		CacheMonitor.recordError();
	}

	CacheMonitor.recordMiss();
	const result = await fallbackOperation();

	// Try to cache the result for next time
	if (cacheSetOperation) {
		try {
			await cacheSetOperation(result);
		} catch (error) {
			console.warn("Failed to cache fallback result:", error);
		}
	}

	return result;
}
