import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MetricCard } from "@/components/metric-card";
import { ChartCardServer } from "@/components/chart-card-server";
import { ChartAreaInteractive } from "@/components/charts/cumulative-growth-chart";
import { WeeklyPaymentsChart } from "@/components/charts/weekly-payments-chart";
import { UniqueWalletsDisplay } from "@/components/charts/unique-wallets-chart";
import { TokenHoldersPieChart } from "@/components/charts/holders-pie-chart";
import { TrendingUp } from "lucide-react";
import { TokenDataService } from "@/lib/services/token-data-service";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

// Generate static params for known tokens
export async function generateStaticParams() {
	return [{ symbol: "lzar" }, { symbol: "lusd" }];
}

// Generate dynamic metadata for each token page
export async function generateMetadata({
	params,
}: {
	params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
	const { symbol } = await params;
	const symbolUpper = symbol.toUpperCase();

	const tokenNames: Record<string, string> = {
		LZAR: "Lisk ZAR",
		LUSD: "Lisk USD",
	};

	const tokenDescriptions: Record<string, string> = {
		LZAR: "South African Rand-backed stablecoin on the Lisk blockchain",
		LUSD: "US Dollar-backed stablecoin on the Lisk blockchain",
	};

	const tokenName = tokenNames[symbolUpper] || symbolUpper;
	const tokenDesc = tokenDescriptions[symbolUpper] || `${symbolUpper} token analytics`;

	return {
		title: `${symbolUpper} Analytics - ${tokenName}`,
		description: `Real-time analytics for ${symbolUpper} (${tokenName}). Track transactions, unique holders, payment metrics, and network growth. ${tokenDesc}.`,
		keywords: [
			symbolUpper,
			tokenName,
			"Lisk",
			"blockchain analytics",
			"token metrics",
			"cryptocurrency",
			"stablecoin",
			"DeFi",
			"token holders",
			"transaction volume",
		],
		openGraph: {
			title: `${symbolUpper} Analytics - ${tokenName}`,
			description: `Live analytics for ${symbolUpper} token. Track holders, transactions, and network metrics on Lisk blockchain.`,
			url: `/dashboard/${symbol}`,
			type: "website",
			images: [
				{
					url: `/og-${symbol}.png`,
					width: 1200,
					height: 630,
					alt: `${symbolUpper} Token Analytics Dashboard`,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${symbolUpper} Analytics - ${tokenName}`,
			description: `Live analytics for ${symbolUpper} token on Lisk blockchain.`,
			images: [`/twitter-${symbol}.png`],
		},
		alternates: {
			canonical: `/dashboard/${symbol}`,
		},
	};
}

const CONTRACT_ADDRESSES: { [key: string]: string } = {
	LZAR: process.env.NEXT_PUBLIC_LZAR_CONTRACT_ADDRESS || "",
	LUSD: process.env.NEXT_PUBLIC_LUSD_CONTRACT_ADDRESS || "",
};

/**
 * Fetch all token data server-side
 */
async function getTokenData(symbol: string) {
	try {
		// Fetch token by symbol
		const token = await TokenDataService.getTokenBySymbol(symbol.toUpperCase());

		if (!token) {
			return null;
		}

		// Fetch all data in parallel
		const [metrics, wallets, payments, holders] = await Promise.all([
			TokenDataService.getAllCumulativeMetrics(token.id),
			TokenDataService.getAllWalletData(token.id),
			TokenDataService.getAllPaymentData(token.id),
			TokenDataService.getTokenHolders(token.id),
		]);

		return {
			token,
			metrics,
			wallets,
			payments,
			holders,
		};
	} catch (error) {
		console.error("Error fetching token data:", error);
		return null;
	}
}

/**
 * Server Component - Dashboard Symbol Page
 */
export default async function SymbolPage({
	params,
}: Readonly<{ params: Promise<{ symbol: string }> }>) {
	const { symbol } = await params;
	const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[symbol.toUpperCase()] || "";

	// Fetch data server-side
	const data = await getTokenData(symbol);

	if (!data) {
		return (
			<DashboardLayout>
				<div className="p-6">
					<div className="text-center py-12">
						<h1 className="text-2xl font-bold text-white mb-2">Token Not Found</h1>
						<p className="text-gray-400">
							The token "{symbol.toUpperCase()}" could not be found.
						</p>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const { metrics, wallets, payments, holders } = data;

	return (
		<DashboardLayout>
			<div className="p-6 space-y-6">
				{/* Header */}
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 rounded-full flex items-center justify-center">
									<TrendingUp className="h-4 w-4 text-white" />
								</div>
								<h1 className="text-3xl font-bold text-white">
									{symbol.toUpperCase()} Token Analytics
								</h1>
							</div>
							<p className="text-gray-400 mt-1">
								Comprehensive analytics for {symbol.toUpperCase()} token on the Lisk
								network
							</p>
							<p className="text-xs text-gray-500 mt-1">
								Data refreshes every 5 minutes
							</p>
						</div>
					</div>
				</div>

				{/* Key Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<MetricCard
						title="Total Supply"
						value={`${
							holders?.totalSupply.toLocaleString() || "N/A"
						} ${symbol.toUpperCase()}`}
						subtitle="Live from blockchain"
					/>
					<MetricCard
						title="Contract Address"
						value={`${CONTRACT_ADDRESS.slice(0, 8)}...${CONTRACT_ADDRESS.slice(-6)}`}
						subtitle="Token Contract address">
						<CopyButton text={CONTRACT_ADDRESS} />
					</MetricCard>
				</div>

				{/* Charts */}
				<div className="space-y-6">
					<Suspense fallback={<ChartSkeleton />}>
						<ChartCardServer
							title="Transactions"
							description={`Cumulative transaction count and total volume for ${symbol.toUpperCase()} over time.`}>
							<ChartAreaInteractive data={metrics} symbol={symbol.toUpperCase()} />
						</ChartCardServer>
					</Suspense>

					{wallets && wallets.length > 0 && (
						<Suspense fallback={<ChartSkeleton />}>
							<ChartCardServer
								title="Unique Wallets"
								description={`Unique wallets and new wallets over time for ${symbol.toUpperCase()}.`}>
								<UniqueWalletsDisplay data={wallets} />
							</ChartCardServer>
						</Suspense>
					)}

					<Suspense fallback={<ChartSkeleton />}>
						<ChartCardServer
							title="Weekly Interest Payments"
							description="Weekly interest payments: toggle between payment count, total amount paid and average payments per week.">
							<WeeklyPaymentsChart data={payments} symbol={symbol.toUpperCase()} />
						</ChartCardServer>
					</Suspense>

					<Suspense fallback={<ChartSkeleton />}>
						<ChartCardServer
							title="Token Holders Distribution"
							description="Distribution of token holders by balance size categories.">
							<TokenHoldersPieChart data={holders} symbol={symbol.toUpperCase()} />
						</ChartCardServer>
					</Suspense>
				</div>
			</div>
		</DashboardLayout>
	);
}

/**
 * Loading skeleton for charts
 */
function ChartSkeleton() {
	return (
		<div className="rounded-xl border border-gray-800 p-6">
			<Skeleton className="h-8 w-48 mb-4" />
			<Skeleton className="h-[300px] w-full" />
		</div>
	);
}
