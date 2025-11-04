import { NextRequest, NextResponse } from "next/server";
import { TokenDataService } from "@/lib/services/token-data-service";
import { PrismaClient } from "@/lib/generated/prisma";
import { withCacheFallback } from "@/lib/cache-middleware";
import { CacheService, CACHE_TTL } from "@/lib/services/cache-service";

const prisma = new PrismaClient();

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tokenId: string }> },
) {
	try {
		const { tokenId } = await params;

		// Validate token ID against values in the database
		const validTokenIds = await prisma.token
			.findMany()
			.then((tokens) => tokens.map((token) => token.id));

		if (!validTokenIds.includes(tokenId)) {
			return NextResponse.json(
				{
					error: "Invalid token ID",
					validTokenIds: validTokenIds.map((id) => ({
						id,
					})),
				},
				{ status: 400 },
			);
		}

		const result = await withCacheFallback(
			// Cache operation
			() => CacheService.getTokenMetrics(tokenId),
			// Fallback operation
			async () => {
				// Fetch all cumulative metrics data for the token without any filtering
				const metrics = await TokenDataService.getAllCumulativeMetrics(tokenId);

				// Convert Decimal values to strings for JSON serialization
				return metrics.map((metric) => ({
					...metric,
					cumulativeTxAmount: metric.cumulativeTxAmount?.toString(),
					dailyTxAmount: metric.dailyTxAmount?.toString(),
				}));
			},
			// Cache set operation
			(data) => CacheService.setTokenMetrics(tokenId, data, CACHE_TTL.MEDIUM),
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching cumulative metrics:", error);
		return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tokenId: string }> },
) {
	try {
		const { tokenId } = await params;
		const body = await request.json();
		const { metricType, data } = body;

		const token = await prisma.token.findUnique({
			where: { id: tokenId },
		});

		if (!token) {
			return NextResponse.json({ error: "Token not found" }, { status: 404 });
		}

		switch (metricType) {
			case "cumulative":
				const cumulativeResult = await prisma.dailyCumulativeMetrics.upsert({
					where: {
						tokenId_date: {
							tokenId: tokenId,
							date: new Date(data.date),
						},
					},
					update: {
						cumulativeTxCount: data.cumulativeTxCount,
						cumulativeTxAmount: data.cumulativeTxAmount,
						dailyTxCount: data.dailyTxCount || 0,
						dailyTxAmount: data.dailyTxAmount || 0,
					},
					create: {
						tokenId: tokenId,
						date: new Date(data.date),
						cumulativeTxCount: data.cumulativeTxCount,
						cumulativeTxAmount: data.cumulativeTxAmount,
						dailyTxCount: data.dailyTxCount || 0,
						dailyTxAmount: data.dailyTxAmount || 0,
					},
				});
				return NextResponse.json(cumulativeResult);

			case "wallets":
				const walletResult = await prisma.dailyUniqueWallets.upsert({
					where: {
						tokenId_date: {
							tokenId: tokenId,
							date: new Date(data.date),
						},
					},
					update: {
						uniqueWalletCount: data.uniqueWalletCount,
						newWallets: data.newWallets || 0,
						activeWallets: data.activeWallets || 0,
					},
					create: {
						tokenId: tokenId,
						date: new Date(data.date),
						uniqueWalletCount: data.uniqueWalletCount,
						newWallets: data.newWallets || 0,
						activeWallets: data.activeWallets || 0,
					},
				});
				return NextResponse.json(walletResult);

			case "payments":
				const paymentResult = await prisma.weeklyPayments.upsert({
					where: {
						tokenId_weekStartDate: {
							tokenId: tokenId,
							weekStartDate: new Date(data.weekStartDate),
						},
					},
					update: {
						totalPaymentsAmount: data.totalPaymentsAmount,
						paymentCount: data.paymentCount || 0,
						averagePayment: data.averagePayment || 0,
					},
					create: {
						tokenId: tokenId,
						weekStartDate: new Date(data.weekStartDate),
						totalPaymentsAmount: data.totalPaymentsAmount,
						paymentCount: data.paymentCount || 0,
						averagePayment: data.averagePayment || 0,
					},
				});
				return NextResponse.json(paymentResult);

			default:
				return NextResponse.json({ error: "Invalid metric type" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error updating token metrics:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
