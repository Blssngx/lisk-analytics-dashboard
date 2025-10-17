import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";

const tokenDataService = new TokenDataService();

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ symbolId: string }> },
) {
	try {
		const { symbolId } = await params;

		const token = await tokenDataService.getTokenBySymbol(symbolId);

		if (!token) {
			return NextResponse.json({ error: "Token not found" }, { status: 404 });
		}

		// Convert Decimal values to strings for JSON serialization
		const serializedToken = {
			...token,
			totalSupply: token.totalSupply?.toString(),
			marketCap: token.marketCap?.toString(),
		};

		return NextResponse.json(serializedToken);
	} catch (error) {
		console.error("Error fetching token:", error);
		return NextResponse.json({ error: "Failed to fetch token" }, { status: 500 });
	}
}
