import { TokenDataService } from "@/lib/services/token-data-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tokenId: string }> },
) {
	try {
		const { tokenId } = await params;

		if (!tokenId) {
			return NextResponse.json({ error: "Token ID is required" }, { status: 400 });
		}

		const holdersData = await TokenDataService.getTokenHolders(tokenId);

		if (!holdersData) {
			return NextResponse.json({ error: "Token holders data not found" }, { status: 404 });
		}

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
