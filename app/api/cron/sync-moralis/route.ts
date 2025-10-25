/**
 * Sync API endpoint to refresh all Moralis data for specified contracts
 * Supports syncing specific contracts or all configured contracts
 * Includes intelligent cache invalidation
 */

import { CacheService } from "@/lib/services/cache-service";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

// Configuration for supported contracts
const SUPPORTED_CONTRACTS = {
	LZAR: process.env.NEXT_PUBLIC_LZAR_CONTRACT_ADDRESS || "",
	LUSD: process.env.NEXT_PUBLIC_LUSD_CONTRACT_ADDRESS || "",
} as const;

// Available query endpoints
const QUERY_ENDPOINTS = [
	"holders",
	"cumulative-growth",
	"unique-wallets",
	"weekly-payments",
] as const;

const SYNC_ROUTE = "/api/cron/sync-moralis";
const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

/**
 * Generate endpoint URLs for a specific contract
 */
function generateEndpoints(contractAddress: string, baseUrl: string): string[] {
	return QUERY_ENDPOINTS.map(
		(endpoint) => `${baseUrl}/api/queries/${endpoint}?contractAddress=${contractAddress}`,
	);
}

/**
 * Execute API calls for a set of endpoints
 */
async function executeEndpoints(endpoints: string[], contractAddress: string) {
	console.log(`Starting sync for contract: ${contractAddress} (${endpoints.length} endpoints)`);

	const results = await Promise.allSettled(
		endpoints.map(async (endpoint) => {
			const startTime = Date.now();

			try {
				console.log(`📡 Calling: ${endpoint}`);

				const response = await fetch(endpoint, {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const data = await response.json();
				const duration = Date.now() - startTime;

				console.log(`✅ Success: ${endpoint} (${duration}ms)`);
				return { endpoint, data, duration };
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ Failed: ${endpoint} (${duration}ms) - ${error}`);
				throw error;
			}
		}),
	);

	// Process results
	const successful: Array<{ endpoint: string; data: any; duration: number }> = [];
	const failed: Array<{ endpoint: string; error: string }> = [];

	results.forEach((result, index) => {
		if (result.status === "fulfilled") {
			successful.push(result.value);
		} else {
			failed.push({
				endpoint: endpoints[index],
				error: result.reason?.message || "Unknown error",
			});
		}
	});

	return { successful, failed };
}

async function getLastSync(contractAddress: string) {
	return prisma.syncInfo.findFirst({
		where: { route: SYNC_ROUTE, contractAddress },
		orderBy: { lastSyncAt: "desc" },
	});
}

async function createSyncInfo(data: any) {
	return prisma.syncInfo.create({ data });
}

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const contractParam = url.searchParams.get("contractAddress");
		const baseUrl = `${url.protocol}//${url.host}`;

		// Determine which contracts to sync
		let contractsToSync: Array<{ address: string; name?: string }> = [];

		if (contractParam) {
			// Sync specific contract
			const contractName = Object.entries(SUPPORTED_CONTRACTS).find(
				([_, addr]) => addr.toLowerCase() === contractParam.toLowerCase(),
			)?.[0];

			contractsToSync.push({
				address: contractParam,
				name: contractName,
			});
		} else {
			// Sync all configured contracts
			contractsToSync = Object.entries(SUPPORTED_CONTRACTS)
				.filter(([_, address]) => address) // Only include contracts with addresses
				.map(([name, address]) => ({ address, name }));
		}

		if (contractsToSync.length === 0) {
			return NextResponse.json(
				{ error: "No valid contracts found to sync" },
				{ status: 400 },
			);
		}

		console.log(`🚀 Starting sync for ${contractsToSync.length} contract(s)`);
		const overallStartTime = Date.now();

		// Invalidate all caches before sync to ensure fresh data
		console.log("🧹 Invalidating all caches before sync...");
		await CacheService.invalidateAllCaches();

		// Check last sync for each contract and skip if not due
		const contractsToActuallySync: typeof contractsToSync = [];
		for (const { address, name } of contractsToSync) {
			const lastSync = await getLastSync(address);
			if (
				lastSync?.lastSyncAt &&
				Date.now() - new Date(lastSync.lastSyncAt).getTime() < SYNC_INTERVAL_MS
			) {
				console.log(
					`⏩ Skipping ${address} (${name}) - last sync at ${lastSync.lastSyncAt}`,
				);
				continue;
			}
			contractsToActuallySync.push({ address, name });
		}
		if (contractsToActuallySync.length === 0) {
			return NextResponse.json(
				{
					error: "No contracts need syncing (all recently synced)",
					skipped: contractsToSync.map((c) => c.address),
				},
				{ status: 200 },
			);
		}

		// Execute sync for all contracts
		const allResults = await Promise.all(
			contractsToActuallySync.map(async ({ address, name }) => {
				const endpoints = generateEndpoints(address, baseUrl);
				// Store sync start info
				const syncStart = new Date();
				let syncInfoId: string | undefined;
				try {
					const syncInfo = await createSyncInfo({
						route: SYNC_ROUTE,
						contractAddress: address,
						startedAt: syncStart,
						syncStatus: "in_progress",
						lastSyncAt: syncStart,
						nextSyncAt: new Date(syncStart.getTime() + SYNC_INTERVAL_MS),
						syncSize: 0,
						dataBytes: 0,
						durationMs: 0,
						finishedAt: syncStart,
						createdAt: syncStart,
						updatedAt: syncStart,
					});
					syncInfoId = syncInfo.id;
				} catch (e) {
					console.error("Failed to create SyncInfo record", e);
				}
				const { successful, failed } = await executeEndpoints(endpoints, address);

				const syncEnd = new Date();
				// Calculate sync stats
				const syncSize = successful.reduce(
					(acc, s) => acc + (Array.isArray(s.data?.data) ? s.data.data.length : 0),
					0,
				);
				const dataBytes = successful.reduce(
					(acc, s) => acc + JSON.stringify(s.data || {}).length,
					0,
				);
				const durationMs = syncEnd.getTime() - syncStart.getTime();
				// Update SyncInfo record
				if (syncInfoId) {
					await prisma.syncInfo.update({
						where: { id: syncInfoId },
						data: {
							syncStatus: failed.length === 0 ? "success" : "failed",
							finishedAt: syncEnd,
							lastSyncAt: syncEnd,
							nextSyncAt: new Date(syncEnd.getTime() + SYNC_INTERVAL_MS),
							syncSize,
							dataBytes,
							durationMs,
							errorMessage: failed.length
								? failed.map((f) => `${f.endpoint}: ${f.error}`).join("; ")
								: null,
							updatedAt: syncEnd,
							totalEndpoints: endpoints.length,
							totalSuccessful: successful.length,
							totalFailed: failed.length,
						},
					});
				}

				// If sync failed, optionally handle alerting or retry logic here

				return {
					contractAddress: address,
					contractName: name,
					successful,
					failed,
					summary: {
						total: endpoints.length,
						successCount: successful.length,
						failedCount: failed.length,
						successRate: `${((successful.length / endpoints.length) * 100).toFixed(
							1,
						)}%`,
					},
				};
			}),
		);

		// Calculate overall statistics
		const overallStats = allResults.reduce(
			(acc, result) => ({
				totalEndpoints: acc.totalEndpoints + result.summary.total,
				totalSuccessful: acc.totalSuccessful + result.summary.successCount,
				totalFailed: acc.totalFailed + result.summary.failedCount,
			}),
			{ totalEndpoints: 0, totalSuccessful: 0, totalFailed: 0 },
		);

		const overallDuration = Date.now() - overallStartTime;

		console.log(
			`🎯 Sync completed in ${overallDuration}ms - Success: ${overallStats.totalSuccessful}/${overallStats.totalEndpoints}`,
		);

		return NextResponse.json({
			success: overallStats.totalFailed === 0,
			duration: overallDuration,
			summary: {
				...overallStats,
				contractsProcessed: contractsToSync.length,
				successRate: `${(
					(overallStats.totalSuccessful / overallStats.totalEndpoints) *
					100
				).toFixed(1)}%`,
			},
			contracts: allResults,
			message: `Sync completed for ${contractsToSync.length} contract(s) in ${overallDuration}ms`,
		});
	} catch (error) {
		console.error("💥 Sync error:", error);
		return NextResponse.json(
			{
				error: "Data sync failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
