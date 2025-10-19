/**
 * Improved Redis Integration with proper error handling, connection management, and caching strategies
 */

import { createClient, RedisClientType } from "redis";
import { CACHE_TTL } from "./services/cache-service";

// Configuration
const REDIS_CONFIG = {
	username: "default",
	password: process.env.REDIS_PASSWORD,
	socket: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT) || 15253,
		connectTimeout: 5000,
		lazyConnect: true, // Don't connect immediately
	},
	// Connection pool settings
	isolationPoolOptions: {
		min: 2,
		max: 10,
	},
	// Retry strategy
	retry_strategy: (times: number) => {
		const delay = Math.min(times * 50, 2000);
		console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
		return delay;
	},
} as const;

class RedisManager {
	private client: RedisClientType | null = null;
	private isConnecting = false;
	private connectionPromise: Promise<void> | null = null;
	private circuitBreakerFailures = 0;
	private readonly maxFailures = 5;
	private circuitBreakerTimeout: NodeJS.Timeout | null = null;

	constructor() {
		this.initializeClient();
	}

	private initializeClient() {
		try {
			this.client = createClient(REDIS_CONFIG) as RedisClientType;
			this.setupEventHandlers();
		} catch (error) {
			console.error("Failed to create Redis client:", error);
			this.client = null;
		}
	}

	private setupEventHandlers() {
		if (!this.client) return;

		this.client.on("error", (err) => {
			console.error("Redis Client Error:", err);
			this.incrementCircuitBreaker();
		});

		this.client.on("connect", () => {
			console.log("✅ Connected to Redis");
			this.resetCircuitBreaker();
		});

		this.client.on("ready", () => {
			console.log("🚀 Redis Client Ready");
		});

		this.client.on("end", () => {
			console.log("📡 Redis Client Disconnected");
		});

		this.client.on("reconnecting", () => {
			console.log("🔄 Redis Client Reconnecting...");
		});
	}

	private incrementCircuitBreaker() {
		this.circuitBreakerFailures++;
		if (this.circuitBreakerFailures >= this.maxFailures) {
			console.warn("🚨 Redis Circuit Breaker OPEN - Too many failures");
			// Reset circuit breaker after 30 seconds
			this.circuitBreakerTimeout = setTimeout(() => {
				this.resetCircuitBreaker();
				console.log("🔄 Redis Circuit Breaker RESET");
			}, 30000);
		}
	}

	private resetCircuitBreaker() {
		this.circuitBreakerFailures = 0;
		if (this.circuitBreakerTimeout) {
			clearTimeout(this.circuitBreakerTimeout);
			this.circuitBreakerTimeout = null;
		}
	}

	private isCircuitBreakerOpen(): boolean {
		return this.circuitBreakerFailures >= this.maxFailures;
	}

	async connect(): Promise<void> {
		if (!this.client) {
			console.warn("Redis client not initialized");
			return;
		}

		if (this.client.isReady) {
			return;
		}

		if (this.isConnecting && this.connectionPromise) {
			return this.connectionPromise;
		}

		this.isConnecting = true;
		this.connectionPromise = this.client
			.connect()
			.then(() => {
				this.isConnecting = false;
				// Return void explicitly
			})
			.catch((error) => {
				console.error("Redis connection failed:", error);
				this.isConnecting = false;
				this.connectionPromise = null;
				throw error;
			});

		try {
			await this.connectionPromise;
		} catch (error) {
			this.isConnecting = false;
			this.connectionPromise = null;
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (this.client && this.client.isReady) {
			await this.client.quit();
		}
		if (this.circuitBreakerTimeout) {
			clearTimeout(this.circuitBreakerTimeout);
		}
	}

	private generateKey(prefix: string, identifier: string): string {
		return `${prefix}:${identifier}`;
	}

	async get<T = any>(prefix: string, identifier: string): Promise<T | null> {
		if (this.isCircuitBreakerOpen()) {
			console.warn("Redis circuit breaker is open, skipping cache read");
			return null;
		}

		try {
			await this.connect();
			if (!this.client?.isReady) return null;

			const key = this.generateKey(prefix, identifier);
			const value = await this.client.get(key);

			if (value) {
				console.log(`📖 Cache HIT: ${key}`);
				return JSON.parse(value);
			} else {
				console.log(`📭 Cache MISS: ${key}`);
				return null;
			}
		} catch (error) {
			console.error(`Redis GET error for ${prefix}:${identifier}:`, error);
			this.incrementCircuitBreaker();
			return null;
		}
	}

	async set<T = any>(
		prefix: string,
		identifier: string,
		value: T,
		ttl: number = CACHE_TTL.MEDIUM,
	): Promise<boolean> {
		if (this.isCircuitBreakerOpen()) {
			console.warn("Redis circuit breaker is open, skipping cache write");
			return false;
		}

		try {
			await this.connect();
			if (!this.client?.isReady) return false;

			const key = this.generateKey(prefix, identifier);
			await this.client.setEx(key, ttl, JSON.stringify(value));
			console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
			return true;
		} catch (error) {
			console.error(`Redis SET error for ${prefix}:${identifier}:`, error);
			this.incrementCircuitBreaker();
			return false;
		}
	}

	async del(prefix: string, identifier: string): Promise<boolean> {
		if (this.isCircuitBreakerOpen()) {
			return false;
		}

		try {
			await this.connect();
			if (!this.client?.isReady) return false;

			const key = this.generateKey(prefix, identifier);
			await this.client.del(key);
			console.log(`🗑️ Cache DELETE: ${key}`);
			return true;
		} catch (error) {
			console.error(`Redis DELETE error for ${prefix}:${identifier}:`, error);
			this.incrementCircuitBreaker();
			return false;
		}
	}

	async invalidatePattern(pattern: string): Promise<boolean> {
		if (this.isCircuitBreakerOpen()) {
			return false;
		}

		try {
			await this.connect();
			if (!this.client?.isReady) return false;

			const keys = await this.client.keys(pattern);
			if (keys.length > 0) {
				await this.client.del(keys);
				console.log(`🧹 Cache INVALIDATE: ${keys.length} keys matching ${pattern}`);
			}
			return true;
		} catch (error) {
			console.error(`Redis INVALIDATE error for pattern ${pattern}:`, error);
			this.incrementCircuitBreaker();
			return false;
		}
	}

	// Health check method
	async ping(): Promise<boolean> {
		try {
			await this.connect();
			if (!this.client?.isReady) return false;

			const result = await this.client.ping();
			return result === "PONG";
		} catch (error) {
			console.error("Redis PING failed:", error);
			return false;
		}
	}

	// Get connection status
	getStatus() {
		return {
			isReady: this.client?.isReady || false,
			isConnecting: this.isConnecting,
			circuitBreakerFailures: this.circuitBreakerFailures,
			circuitBreakerOpen: this.isCircuitBreakerOpen(),
		};
	}
}

// Singleton instance
export const redisManager = new RedisManager();

// Export alias for backwards compatibility
export const redisClient = redisManager;

// Graceful shutdown handler
process.on("SIGINT", async () => {
	console.log("🛑 Shutting down Redis connection...");
	await redisManager.disconnect();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("🛑 Shutting down Redis connection...");
	await redisManager.disconnect();
	process.exit(0);
});

export default redisManager;
