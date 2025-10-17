import { initializeMoralis } from "@/lib/moralis";
import { TokenDataService } from "@/lib/services/token-data-service";
import { CumulativeGrowthProcessor } from "@/lib/services/cumulative-growth-processor";
import { NextRequest, NextResponse } from "next/server";
import { EvmChain } from "@moralisweb3/common-evm-utils";

const tokenDataService = new TokenDataService();

export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({} as any));
		const contractAddress: string | undefined = body?.contractAddress;

		if (!contractAddress) {
			return NextResponse.json({ error: "contractAddress is required" }, { status: 400 });
		}

		// Resolve the token by contract address
		const token = await tokenDataService.getTokenByContractAddress(contractAddress);
		if (!token) {
			console.error(`Token not found for contractAddress: ${contractAddress}`);
			return NextResponse.json(
				{ error: "Token not found for contractAddress" },
				{ status: 404 },
			);
		}

		// Fetch from Moralis for this specific contract
		const moralis = await initializeMoralis();
		const firstPage = await moralis.EvmApi.token.getTokenTransfers({
			address: token.contractAddress,
			chain: EvmChain.create(1135),
			limit: 100,
		});

		let compiledData = firstPage.raw;
		while (compiledData.cursor) {
			const next = await moralis.EvmApi.token.getTokenTransfers({
				address: token.contractAddress,
				chain: EvmChain.create(1135),
				limit: 100,
				cursor: compiledData.cursor,
			});
			compiledData = { ...next.raw, result: [...compiledData.result, ...next.raw.result] };
		}

		// Process and calculate cumulative data
		const processedData = CumulativeGrowthProcessor.processCumulativeData(compiledData);

		// Store in db
		await tokenDataService.bulkUpsertCumulativeMetrics(token.id, processedData);

		return NextResponse.json({
			success: true,
			data: processedData,
			message: "Cumulative growth data updated",
		});
	} catch (error) {
		//console.error('Cumulative growth query error:', error);
		return NextResponse.json(
			{
				error: "Cumulative growth data fetch failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
