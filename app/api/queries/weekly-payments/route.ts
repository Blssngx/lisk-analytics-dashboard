// app/api/queries/weekly-payments/route.ts
import { TokenDataService } from "@/lib/services/token-data-service";
import { WeeklyPaymentsProcessor } from "@/lib/services/weekly-payments-processor";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const contractAddress: string | undefined =
			searchParams.get("contractAddress") || undefined;

		if (!contractAddress) {
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

		const MORALIS_API_KEY = process.env.MORALIS_API_KEY || "";
		const transferMethodId = "0x0b7e4c94";

		// Fetch all pages from Moralis REST for this address
		let allTransactions: any[] = [];
		let cursor: string | null = null;
		do {
			const url = new URL(
				`https://deep-index.moralis.io/api/v2.2/${token.contractAddress}/verbose`,
			);
			url.searchParams.set("chain", "0x46f");
			url.searchParams.set("order", "DESC");
			url.searchParams.set("limit", "100");
			if (cursor) url.searchParams.set("cursor", cursor);

			const res = await fetch(url.toString(), {
				headers: { "X-API-Key": MORALIS_API_KEY, accept: "application/json" },
			});
			if (!res.ok) {
				throw new Error(`Moralis API request failed: ${res.status} ${res.statusText}`);
			}
			const data = await res.json();
			allTransactions = [...allTransactions, ...(data.result || [])];
			cursor = data.cursor || null;
		} while (cursor);
		const transferTransactions = allTransactions.filter(
			(tx: any) => tx.input && tx.input.startsWith(transferMethodId),
		);

		const processedData = await WeeklyPaymentsProcessor.processWeeklyPaymentsFromTransactions(
			transferTransactions,
			transferMethodId,
		);

		for (const weeklyData of processedData) {
			await TokenDataService.upsertPaymentData(token.id, weeklyData);
		}

		return NextResponse.json({
			success: true,
			data: processedData,
			message: "Weekly payments data updated",
		});
	} catch (error) {
		//console.error("Weekly payments query error:", error);
		return NextResponse.json(
			{
				error: "Weekly payments data fetch failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
