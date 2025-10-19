import { NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { PrismaClient } from "@/lib/generated/prisma";
import { redisClient } from "@/lib/redis";

const prisma = new PrismaClient();

export async function GET({ params }: { params: Promise<{ tokenId: string }> }) {
	try {
		const { tokenId } = await params;
		const cacheKey = `token_wallets_${tokenId}`;

		// Validate token ID against hardcoded values
		const validTokenIds = await prisma.token
			.findMany()
			.then((tokens) => tokens.map((token) => token.id));

		// fetch from cache
		const cachedWallets = await redisClient.get(cacheKey);
		if (cachedWallets) {
			return NextResponse.json(JSON.parse(cachedWallets));
		}

		if (!validTokenIds.includes(tokenId)) {
			return NextResponse.json(
				{
					error: "Invalid token ID",
					validTokenIds: validTokenIds.map((id) => ({ id })),
				},
				{ status: 400 },
			);
		}

		// Fetch all wallet data for the token without any filtering
		const wallets = await TokenDataService.getAllWalletData(tokenId);

		// Cache the wallet data for future requests
		await redisClient.set(cacheKey, JSON.stringify(wallets), {
			EX: 60 * 5, // Cache for 5 minutes
		});

		// No need to convert Int values to strings for JSON serialization
		return NextResponse.json(wallets);
	} catch (error) {
		console.error("Error fetching wallet data:", error);
		return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
	}
}
