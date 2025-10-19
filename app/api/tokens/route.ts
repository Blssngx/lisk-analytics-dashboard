// Example: Refactored tokens route with improved caching
import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { withCacheFallback } from "@/lib/cache-middleware";
import { CacheService, CACHE_TTL } from "@/lib/services/cache-service";

export async function GET() {
	try {
		const result = await withCacheFallback(
			// Cache operation
			() => CacheService.getTokens(),
			// Fallback operation
			async () => {
				const tokens = await TokenDataService.getAllTokens();

				// Convert Decimal values to strings for JSON serialization
				return tokens.map((token) => ({
					...token,
					totalSupply: token.totalSupply?.toString(),
					marketCap: token.marketCap?.toString(),
				}));
			},
			// Cache set operation
			(data) => CacheService.setTokens(data, CACHE_TTL.LONG),
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching tokens:", error);

		return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, symbol, contractAddress, decimals = 18, totalSupply = 0 } = body;

		if (!name || !symbol || !contractAddress) {
			return NextResponse.json(
				{ error: "Missing required fields: name, symbol, contractAddress" },
				{ status: 400 },
			);
		}

		const token = await TokenDataService.createToken({
			name,
			symbol,
			contractAddress,
			decimals,
			totalSupply,
		});

		// Invalidate tokens cache since we added a new token
		await CacheService.invalidateAllCaches();

		return NextResponse.json(token, { status: 201 });
	} catch (error) {
		console.error("Error creating token:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
