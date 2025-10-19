import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { redisClient } from "@/lib/redis";

export async function GET() {
	const cacheKey = "tokens";

	try {
		// retrieve all tokens from redis cache
		const cachedTokens = await redisClient.get(cacheKey);
		if (cachedTokens) {
			// If found in cache, return cached tokens
			return NextResponse.json(JSON.parse(cachedTokens));
		}
		// If not in cache, fetch from database
		let tokens = await TokenDataService.getAllTokens();

		// Convert Decimal values to strings for JSON serialization
		const serializedTokens = tokens.map((token) => ({
			...token,
			totalSupply: token.totalSupply?.toString(),
			marketCap: token.marketCap?.toString(),
		}));

		// Store in cache for future requests
		await redisClient.set(cacheKey, JSON.stringify(serializedTokens), {
			EX: 60 * 5, // Cache for 5 minutes
		});
		return NextResponse.json(serializedTokens);
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

		return NextResponse.json(token, { status: 201 });
	} catch (error) {
		console.error("Error creating token:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
