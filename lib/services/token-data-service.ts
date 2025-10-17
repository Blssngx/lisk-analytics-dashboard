import { PrismaClient } from "@/lib/generated/prisma";
import { TokenData, PaymentData, CumulativeMetricsData, WalletData } from "@/types";

export class TokenDataService {
	private static readonly prisma: PrismaClient = new PrismaClient();

	// Token Management
	static async createToken(tokenData: TokenData) {
		return await this.prisma.token.create({
			data: {
				name: tokenData.name,
				symbol: tokenData.symbol,
				contractAddress: tokenData.contractAddress,
				decimals: tokenData.decimals || 18,
				totalSupply: tokenData.totalSupply || 0,
				totalSupplyFormatted: tokenData.totalSupplyFormatted,
				circulatingSupply: tokenData.circulatingSupply,
				marketCap: tokenData.marketCap || 0,
				blockNumber: tokenData.blockNumber,
				validated: tokenData.validated || 1,
				verifiedContract: tokenData.verifiedContract || false,
				possibleSpam: tokenData.possibleSpam || false,
				isActive: true,
			},
		});
	}

	static async getToken(tokenId: string) {
		return await this.prisma.token.findUnique({
			where: { id: tokenId },
		});
	}

	static async getTokenBySymbol(symbol: string) {
		return await this.prisma.token.findUnique({
			where: { symbol },
		});
	}

	static async getAllTokens() {
		return await this.prisma.token.findMany({
			where: { isActive: true },
		});
	}

	// Cumulative Metrics
	static async upsertCumulativeMetrics(tokenId: string, data: CumulativeMetricsData) {
		return await this.prisma.dailyCumulativeMetrics.upsert({
			where: {
				tokenId_date: {
					tokenId,
					date: new Date(data.date),
				},
			},
			update: {
				cumulativeTxCount: data.cumulativeTxCount,
				cumulativeTxAmount: data.cumulativeTxAmount,
				dailyTxCount: data.dailyTxCount ?? 0,
				dailyTxAmount: data.dailyTxAmount ?? 0,
			},
			create: {
				tokenId,
				date: new Date(data.date),
				cumulativeTxCount: data.cumulativeTxCount,
				cumulativeTxAmount: data.cumulativeTxAmount,
				dailyTxCount: data.dailyTxCount ?? 0,
				dailyTxAmount: data.dailyTxAmount ?? 0,
			},
		});
	}

	static async getAllCumulativeMetrics(tokenId: string) {
		return await this.prisma.dailyCumulativeMetrics.findMany({
			where: { tokenId },
			orderBy: { date: "asc" },
		});
	}

	// Wallet Data
	static async upsertWalletData(tokenId: string, data: WalletData) {
		return await this.prisma.dailyUniqueWallets.upsert({
			where: {
				tokenId_date: {
					tokenId,
					date: new Date(data.date),
				},
			},
			update: {
				uniqueWalletCount: data.uniqueWalletCount,
				newWallets: data.newWallets || 0,
				activeWallets: data.activeWallets || 0,
			},
			create: {
				tokenId,
				date: new Date(data.date),
				uniqueWalletCount: data.uniqueWalletCount,
				newWallets: data.newWallets || 0,
				activeWallets: data.activeWallets || 0,
			},
		});
	}

	static async getAllWalletData(tokenId: string) {
		return await this.prisma.dailyUniqueWallets.findMany({
			where: { tokenId },
			orderBy: { date: "asc" },
		});
	}

	// Payment Data
	static async upsertPaymentData(tokenId: string, data: PaymentData) {
		return await this.prisma.weeklyPayments.upsert({
			where: {
				tokenId_weekStartDate: {
					tokenId,
					weekStartDate: new Date(data.weekStartDate),
				},
			},
			update: {
				totalPaymentsAmount: data.totalPaymentsAmount,
				paymentCount: data.paymentCount || 0,
				averagePayment: data.averagePayment || 0,
			},
			create: {
				tokenId,
				weekStartDate: new Date(data.weekStartDate),
				totalPaymentsAmount: data.totalPaymentsAmount,
				paymentCount: data.paymentCount || 0,
				averagePayment: data.averagePayment || 0,
			},
		});
	}

	static async getAllPaymentData(tokenId: string) {
		return await this.prisma.weeklyPayments.findMany({
			where: { tokenId },
			orderBy: { weekStartDate: "asc" },
		});
	}

	// Bulk Operations
	static async bulkUpsertCumulativeMetrics(tokenId: string, dataArray: CumulativeMetricsData[]) {
		const operations = dataArray.map((data) => this.upsertCumulativeMetrics(tokenId, data));
		return await Promise.all(operations);
	}

	static async bulkUpsertWalletData(tokenId: string, dataArray: WalletData[]) {
		const operations = dataArray.map((data) => this.upsertWalletData(tokenId, data));
		return await Promise.all(operations);
	}

	static async getTokenByContractAddress(contractAddress: string) {
		return await this.prisma.token.findFirst({
			where: {
				contractAddress: {
					equals: contractAddress.toLowerCase(),
					mode: "insensitive", // Case-insensitive search
				},
			},
		});
	}

	// Token Holders methods
	static async upsertTokenHolders(tokenId: string, data: any) {
		const today = new Date().toISOString().split("T")[0];

		return await this.prisma.tokenHolders.upsert({
			where: {
				tokenId_date: {
					tokenId,
					date: new Date(today),
				},
			},
			update: {
				totalHolders: data.totalHolders,
				totalSupply: data.totalSupply,
				whaleCount: data.distribution.whales,
				largeCount: data.distribution.large,
				mediumCount: data.distribution.medium,
				smallCount: data.distribution.small,
				holdersData: data.holders,
			},
			create: {
				date: new Date(today),
				totalHolders: data.totalHolders,
				totalSupply: data.totalSupply,
				whaleCount: data.distribution.whales,
				largeCount: data.distribution.large,
				mediumCount: data.distribution.medium,
				smallCount: data.distribution.small,
				holdersData: data.holders,
				token: {
					connect: { id: tokenId },
				},
			},
		});
	}

	static async bulkUpsertTokenHolders(tokenId: string, data: any) {
		return await this.upsertTokenHolders(tokenId, data);
	}

	static async getTokenHolders(tokenId: string) {
		return await this.prisma.tokenHolders.findFirst({
			where: { tokenId },
			orderBy: { date: "desc" },
		});
	}
}
