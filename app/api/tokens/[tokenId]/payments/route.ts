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

		// Fetch all payment data for the token without any filtering
		const payments = await TokenDataService.getAllPaymentData(tokenId);

		// Convert Decimal values to strings for JSON serialization
		const serializedPayments = payments.map((payment) => ({
			...payment,
			totalPaymentsAmount: payment.totalPaymentsAmount?.toString(),
			averagePayment: payment.averagePayment?.toString(),
		}));

		return NextResponse.json(serializedPayments);
	} catch (error) {
		console.error("Error fetching payment data:", error);
		return NextResponse.json({ error: "Failed to fetch payment data" }, { status: 500 });
	}
}
