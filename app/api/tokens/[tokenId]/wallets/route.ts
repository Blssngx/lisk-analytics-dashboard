import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tokenId: string }> },
) {
	try {
		const { tokenId } = await params;

		// Validate token ID against hardcoded values
		const validTokenIds = await prisma.token
			.findMany()
			.then((tokens) => tokens.map((token) => token.id));

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

		// No need to convert Int values to strings for JSON serialization
		return NextResponse.json(wallets);
	} catch (error) {
		console.error("Error fetching wallet data:", error);
		return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
	}
}
