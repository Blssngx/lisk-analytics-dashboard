/**
 * Sync API endpoint to refresh all Moralis data for specified contracts
 * Supports syncing specific contracts or all configured contracts
 */

import { NextResponse, NextRequest } from "next/server";

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

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const contractParam = url.searchParams.get("contractAddress");
		// const baseUrl = `${url.protocol}//${url.host}`;
		const baseUrl = "";

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

		// Execute sync for all contracts
		const allResults = await Promise.all(
			contractsToSync.map(async ({ address, name }) => {
				const endpoints = generateEndpoints(address, baseUrl);
				const { successful, failed } = await executeEndpoints(endpoints, address);

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
