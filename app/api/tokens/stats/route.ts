import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { PrismaClient } from "@/lib/generated/prisma";
import { withCacheFallback } from "@/lib/cache-middleware";
import { CacheService, CACHE_TTL } from "@/lib/services/cache-service";

const prisma = new PrismaClient();

interface TokenStat {
	value: string;
	label: string;
	description: string;
	rawValue?: number;
}

interface TokenStats {
	stats: {
		totalValueInCirculation: TokenStat;
		uniqueUsers: TokenStat;
		transactionsProcessed: TokenStat;
	};
	lastUpdated: string;
	tokenSymbol: string;
	tokenName: string;
}

interface AllTokensStats {
	stats: {
		[key: string]: {
			totalValueInCirculation: TokenStat;
			uniqueUsers: TokenStat;
			transactionsProcessed: TokenStat;
		};
	};
	lastUpdated: string;
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
function formatNumber(num: number): string {
	if (num >= 1_000_000_000) {
		return `${(num / 1_000_000_000).toFixed(1)}B`;
	}
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}
	return num.toLocaleString();
}

/**
 * Format currency values with R prefix
 */
function formatCurrency(num: number): string {
	if (num >= 1_000_000_000) {
		return `R${(num / 1_000_000_000).toFixed(1)}B`;
	}
	if (num >= 1_000_000) {
		return `R${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1_000) {
		return `R${(num / 1_000).toFixed(1)}K`;
	}
	return `R${num.toLocaleString()}`;
}

/**
 * Calculate growth percentage between two values
 */
function calculateGrowth(current: number, previous: number): string {
	if (previous === 0) return "+100%";
	const growth = ((current - previous) / previous) * 100;
	const sign = growth >= 0 ? "+" : "";
	return `${sign}${growth.toFixed(1)}%`;
}

/**
 * Calculate stats for a single token
 */
async function calculateTokenStats(tokenId: string, tokenSymbol: string) {
	// Fetch only the data needed for the three core stats
	const [token, metrics, wallets] = await Promise.all([
		TokenDataService.getToken(tokenId),
		TokenDataService.getAllCumulativeMetrics(tokenId),
		TokenDataService.getAllWalletData(tokenId),
	]);

	if (!token) {
		throw new Error(`Token not found: ${tokenId}`);
	}

	// Calculate the three core stats
	// 1. Total Value in Circulation
	const totalSupply = Number(token.totalSupply) || 0;
	const circulatingSupply = Number(token.circulatingSupply) || totalSupply;

	// 2. Unique Users
	const latestWalletData = wallets.length > 0 ? wallets[wallets.length - 1] : null;
	const uniqueUsers = latestWalletData?.uniqueWalletCount || 0;

	// 3. Total Transactions Processed
	const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;
	const totalTransactions = latestMetrics?.cumulativeTxCount || 0;

	return {
		totalValueInCirculation: {
			value: formatCurrency(circulatingSupply),
			label: "Total Value in Circulation",
			description: `Every token backed 1:1 with rand reserves, powering payments and rewards across the country.`,
			rawValue: circulatingSupply,
		},
		uniqueUsers: {
			value: formatNumber(uniqueUsers),
			label: "Unique Users",
			description: `From everyday spenders to fintech platforms — the ${tokenSymbol} network is growing daily.`,
			rawValue: uniqueUsers,
		},
		transactionsProcessed: {
			value: `${formatNumber(totalTransactions)}+`,
			label: "Transactions Processed",
			description: `Fast, final, and fee-efficient — proving stablecoins can work at scale.`,
			rawValue: totalTransactions,
		},
	};
}

export async function GET(request: NextRequest) {
	try {
		const result = await withCacheFallback(
			// Cache operation
			async () => {
				const cached = await CacheService.get("all_tokens_stats", "global");
				return cached;
			},
			// Fallback operation - compute stats for all tokens
			async () => {
				// Fetch all active tokens
				const tokens = await TokenDataService.getAllTokens();

				if (!tokens || tokens.length === 0) {
					throw new Error("No tokens found");
				}

				// Calculate stats for each token in parallel
				const statsPromises = tokens.map(async (token) => {
					try {
						const stats = await calculateTokenStats(token.id, token.symbol);
						return {
							symbol: token.symbol.toLowerCase(),
							stats,
						};
					} catch (error) {
						console.error(`Error calculating stats for ${token.symbol}:`, error);
						return null;
					}
				});

				const statsResults = await Promise.all(statsPromises);

				// Build the response object with stats keyed by token symbol
				const statsObject: AllTokensStats["stats"] = {};

				statsResults.forEach((result) => {
					if (result) {
						statsObject[result.symbol] = result.stats;
					}
				});

				const response: AllTokensStats = {
					stats: statsObject,
					lastUpdated: new Date().toISOString(),
				};

				return response;
			},
			// Cache set operation
			async (data) => {
				await CacheService.set("all_tokens_stats", "global", data, CACHE_TTL.MEDIUM);
			},
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching token stats:", error);

		if (error instanceof Error && error.message === "No tokens found") {
			return NextResponse.json({ error: "No tokens found" }, { status: 404 });
		}

		return NextResponse.json(
			{
				error: "Failed to fetch token stats",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
