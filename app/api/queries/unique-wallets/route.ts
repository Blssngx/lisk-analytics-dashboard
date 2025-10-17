import { initializeMoralis } from "@/lib/moralis";
import { TokenDataService } from "@/lib/services/token-data-service";
import { WalletDataProcessor } from "@/lib/services/wallet-data-processor";
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

		const token = await tokenDataService.getTokenByContractAddress(contractAddress);
		if (!token) {
			console.error(`Token not found for contractAddress: ${contractAddress}`);
			return NextResponse.json(
				{ error: "Token not found for contractAddress" },
				{ status: 404 },
			);
		}

		// Fetch from moralis - use token transfers to get all transactions involving this token
		const moralis = await initializeMoralis();
		const firstPage = await moralis.EvmApi.token.getTokenTransfers({
			address: token.contractAddress,
			chain: EvmChain.create(1135), // Lisk chain ID
			limit: 100,
		});

		let compiledData = firstPage.raw;
		//refetch when there is more than one page
		while (compiledData.cursor) {
			const newData = await moralis.EvmApi.token.getTokenTransfers({
				address: token.contractAddress,
				chain: EvmChain.create(1135), // Lisk chain ID
				limit: 100,
				cursor: compiledData.cursor,
			});
			compiledData = {
				...newData.raw,
				result: [...compiledData.result, ...newData.raw.result],
			};
		}

		// Process and calculate wallet data from transfers
		const processedData = WalletDataProcessor.processWalletDataFromTransfers(
			compiledData.result,
		);

		// Store in db
		await tokenDataService.bulkUpsertWalletData(token.id, processedData);

		return NextResponse.json({
			success: true,
			data: processedData,
			message: "Unique wallets data updated",
		});
	} catch (error) {
		//console.error('Unique wallets query error:', error);
		return NextResponse.json(
			{
				error: "Unique wallets data fetch failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
