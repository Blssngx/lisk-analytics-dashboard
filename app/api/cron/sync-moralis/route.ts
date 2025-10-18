// get method to call the api routes under the queries folder

import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const contractAddress: string | undefined =
			searchParams.get("contractAddress") || undefined;

		if (!contractAddress) {
			return NextResponse.json({ error: "contractAddress is required" }, { status: 400 });
		}

		// Get the base URL from the request
		const baseUrl = `${url.protocol}//${url.host}`;

		// Define all the query endpoints to call
		const queryEndpoints = [
			`${baseUrl}/api/queries/holders?contractAddress=${contractAddress}`,
			`${baseUrl}/api/queries/cumulative-growth?contractAddress=${contractAddress}`,
			`${baseUrl}/api/queries/unique-wallets?contractAddress=${contractAddress}`,
			`${baseUrl}/api/queries/weekly-payments?contractAddress=${contractAddress}`,
		];

		console.log(`Starting sync for contract: ${contractAddress}`);

		// Call all endpoints asynchronously and await them all
		const results = await Promise.allSettled(
			queryEndpoints.map(async (endpoint) => {
				console.log(`Calling endpoint: ${endpoint}`);
				const response = await fetch(endpoint, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(
						`Failed to call ${endpoint}: ${response.status} ${response.statusText}`,
					);
				}

				const data = await response.json();
				console.log(`Successfully called: ${endpoint}`);
				return { endpoint, data };
			}),
		);

		// Process results and separate successful and failed calls
		const successful: any[] = [];
		const failed: any[] = [];

		results.forEach((result, index) => {
			if (result.status === "fulfilled") {
				successful.push(result.value);
			} else {
				failed.push({
					endpoint: queryEndpoints[index],
					error: result.reason?.message || "Unknown error",
				});
			}
		});

		// Log results
		console.log(`Sync completed. Successful: ${successful.length}, Failed: ${failed.length}`);

		return NextResponse.json({
			success: true,
			contractAddress,
			summary: {
				total: queryEndpoints.length,
				successful: successful.length,
				failed: failed.length,
			},
			results: {
				successful,
				failed,
			},
			message: `Sync completed for contract ${contractAddress}`,
		});
	} catch (error) {
		console.error("Sync moralis error:", error);
		return NextResponse.json(
			{
				error: "Data sync failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
