import { redisClient } from "@/lib/redis";
import { TokenDataService } from "@/lib/services/token-data-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tokenId: string }> },
) {
	try {
		const { tokenId } = await params;
		const cacheKey = `token_holders_${tokenId}`;

		if (!tokenId) {
			return NextResponse.json({ error: "Token ID is required" }, { status: 400 });
		}

		// Fetch token holders data from the service
		const cachedHolders = await redisClient.get(cacheKey);
		if (cachedHolders) {
			return NextResponse.json(JSON.parse(cachedHolders));
		}

		const holdersData = await TokenDataService.getTokenHolders(tokenId);

		if (!holdersData) {
			return NextResponse.json({ error: "Token holders data not found" }, { status: 404 });
		}

		// Cache the holders data for future requests
		await redisClient.set(cacheKey, JSON.stringify(holdersData), {
			EX: 60 * 5, // Cache for 5 minutes
		});
		return NextResponse.json(holdersData);
	} catch (error) {
		console.error("Token holders fetch error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch token holders data",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
