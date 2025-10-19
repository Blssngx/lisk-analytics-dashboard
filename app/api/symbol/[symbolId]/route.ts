import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { withCacheFallback } from "@/lib/cache-middleware";
import { CacheService, CACHE_TTL } from "@/lib/services/cache-service";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ symbolId: string }> },
) {
	try {
		const { symbolId } = await params;

		const result = await withCacheFallback(
			// Cache operation
			() => CacheService.getTokenBySymbol(symbolId),
			// Fallback operation
			async () => {
				const token = await TokenDataService.getTokenBySymbol(symbolId);

				if (!token) {
					throw new Error("Token not found");
				}

				// Convert Decimal values to strings for JSON serialization
				return {
					...token,
					totalSupply: token.totalSupply?.toString(),
					marketCap: token.marketCap?.toString(),
				};
			},
			// Cache set operation
			(data) => CacheService.setTokenBySymbol(symbolId, data, CACHE_TTL.LONG),
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching token:", error);

		if (error instanceof Error && error.message === "Token not found") {
			return NextResponse.json({ error: "Token not found" }, { status: 404 });
		}

		return NextResponse.json({ error: "Failed to fetch token" }, { status: 500 });
	}
}
