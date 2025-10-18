import { initializeMoralis } from "@/lib/moralis";
import { TokenDataService } from "@/lib/services/token-data-service";
import { TokenHoldersProcessor } from "@/lib/services/token-holders-processor";
import { NextRequest, NextResponse } from "next/server";
import { EvmChain } from "@moralisweb3/common-evm-utils";

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const contractAddress: string | undefined =
			searchParams.get("contractAddress") || undefined;

		if (!contractAddress) {
			console.error("contractAddress is missing in the request body", searchParams);
			return NextResponse.json({ error: "contractAddress is required" }, { status: 400 });
		}

		const token = await TokenDataService.getTokenByContractAddress(
			contractAddress.toLowerCase(),
		);
		if (!token) {
			console.error(`Token not found for contractAddress: ${contractAddress}`);
			return NextResponse.json(
				{ error: "Token not found for contractAddress" },
				{ status: 404 },
			);
		}

		// Fetch from Moralis - get token owners
		const moralis = await initializeMoralis();
		const firstPage = await moralis.EvmApi.token.getTokenOwners({
			chain: EvmChain.create(1135),
			order: "DESC",
			tokenAddress: token.contractAddress,
		});

		console.log(
			`Fetched first page of token owners for ${token.contractAddress}, count: ${
				firstPage.raw().result.length
			}`,
		);

		// Initialize with first page data
		let allHolders = [...firstPage.raw().result];
		let currentCursor = firstPage.raw().cursor;

		// Fetch all remaining pages using cursor
		while (currentCursor) {
			const nextPage = await moralis.EvmApi.token.getTokenOwners({
				chain: EvmChain.create(1135), // Lisk chain ID
				order: "DESC",
				tokenAddress: token.contractAddress,
				cursor: currentCursor,
			});

			// Add new results to our collection
			allHolders = [...allHolders, ...nextPage.raw().result];
			currentCursor = nextPage.raw().cursor;
		}

		// Process and calculate holders data
		const processedData = TokenHoldersProcessor.processHoldersData(allHolders, token);

		// Store both processed data and raw data for bubble chart
		const dataToStore = {
			...processedData,
			holders: allHolders, // Store raw Moralis data for client-side processing
		};

		// Store in db
		await TokenDataService.bulkUpsertTokenHolders(token.id, dataToStore);

		return NextResponse.json({
			success: true,
			data: dataToStore, // Return the full dataToStore object which includes both processed and raw data
			message: "Token holders data updated",
		});
	} catch (error) {
		console.error("Token holders query error:", error);
		return NextResponse.json(
			{
				error: "Token holders data fetch failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
