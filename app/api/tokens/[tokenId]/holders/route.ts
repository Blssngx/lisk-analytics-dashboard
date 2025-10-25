import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { withCacheFallback } from "@/lib/cache-middleware";
import { CacheService, CACHE_TTL } from "@/lib/services/cache-service";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tokenId: string }> },
) {
	try {
		const { tokenId } = await params;

		if (!tokenId) {
			return NextResponse.json({ error: "Token ID is required" }, { status: 400 });
		}

		const result = await withCacheFallback(
			// Cache operation
			() => CacheService.getTokenHolders(tokenId),
			// Fallback operation
			async () => {
				const holdersData = await TokenDataService.getTokenHolders(tokenId);

				if (!holdersData) {
					throw new Error("Token holders data not found");
				}

				return holdersData;
			},
			// Cache set operation
			(data) => CacheService.setTokenHolders(tokenId, data, CACHE_TTL.MEDIUM),
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Token holders fetch error:", error);

		if (error instanceof Error && error.message === "Token holders data not found") {
			return NextResponse.json({ error: "Token holders data not found" }, { status: 404 });
		}

		return NextResponse.json(
			{
				error: "Failed to fetch token holders data",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
