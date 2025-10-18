import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";

export async function GET() {
	try {
		const tokens = await TokenDataService.getAllTokens();

		// Convert Decimal values to strings for JSON serialization
		const serializedTokens = tokens.map((token) => ({
			...token,
			totalSupply: token.totalSupply?.toString(),
			marketCap: token.marketCap?.toString(),
		}));

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
