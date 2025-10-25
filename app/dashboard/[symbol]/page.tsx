"use client";
import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { Button } from "@/components/ui/button";
import { ChartAreaInteractive } from "@/components/charts/cumulative-growth-chart";
import { WeeklyPaymentsChart } from "@/components/charts/weekly-payments-chart";
import { UniqueWalletsDisplay } from "@/components/charts/unique-wallets-chart";
import { TokenHoldersPieChart } from "@/components/charts/holders-pie-chart";
import { PlayCircle, TrendingUp, Copy, Check } from "lucide-react";
import {
	useTokenBySymbol,
	useCumulativeMetrics,
	useWalletData,
	useWeeklyPayments,
	useTokenHolders,
} from "@/hooks/use-token-data";

export default function SymbolPage({
	params,
}: Readonly<{ params: Promise<Readonly<{ symbol: string }>> }>) {
	const { symbol } = React.use(params);

	const CONTRACT_ADDRESSES: { [key: string]: string } = {
		LZAR: process.env.NEXT_PUBLIC_LZAR_CONTRACT_ADDRESS || "",
		LUSD: process.env.NEXT_PUBLIC_LUSD_CONTRACT_ADDRESS || "",
	};

	const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[symbol.toUpperCase()] || "";

	// REST API cached data
	const { data: tokenData, isLoading: tokenLoading } = useTokenBySymbol(symbol.toUpperCase());
	const tokenId = tokenData?.id || "";

	// Only run these queries when we have a valid tokenId
	const {
		data: cumulativeGrowthData,
		isLoading: cumulativeGrowthLoading,
		error: cumulativeGrowthError,
		refetch: refetchCumulativeGrowth,
	} = useCumulativeMetrics(tokenId);
	const {
		data: uniqueWalletsData,
		isLoading: uniqueWalletsLoading,
		error: uniqueWalletsError,
		refetch: refetchUniqueWallets,
	} = useWalletData(tokenId);
	const {
		data: weeklyPaymentsData,
		isLoading: weeklyPaymentsLoading,
		error: weeklyPaymentsError,
		refetch: refetchWeeklyPayments,
	} = useWeeklyPayments(tokenId);
	const {
		data: tokenHoldersData,
		isLoading: tokenHoldersLoading,
		error: tokenHoldersError,
		refetch: refetchTokenHolders,
	} = useTokenHolders(tokenId);

	const [loadingStates, setLoadingStates] = useState({
		cumulativeGrowth: false,
		uniqueWallets: false,
		weeklyPayments: false,
		tokenHolders: false,
		allQueries: false,
	});

	const runQuery = async (queryType: keyof typeof loadingStates) => {
		setLoadingStates((prev) => ({ ...prev, [queryType]: true }));
		try {
			switch (queryType) {
				case "cumulativeGrowth":
					await refetchCumulativeGrowth();
					break;
				case "uniqueWallets":
					await refetchUniqueWallets();
					break;
				case "weeklyPayments":
					await refetchWeeklyPayments();
					break;
				case "tokenHolders":
					await refetchTokenHolders();
					break;
			}
		} finally {
			setLoadingStates((prev) => ({ ...prev, [queryType]: false }));
		}
	};

	const runAllQueries = async () => {
		setLoadingStates((prev) => ({ ...prev, allQueries: true }));
		try {
			await Promise.all([
				refetchCumulativeGrowth(),
				refetchUniqueWallets(),
				refetchWeeklyPayments(),
				refetchTokenHolders(),
			]);
		} finally {
			setLoadingStates((prev) => ({ ...prev, allQueries: false }));
		}
	};

	const [copied, setCopied] = useState(false);
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

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
						</div>
						<div className="flex gap-2">
							<Button
								onClick={runAllQueries}
								disabled={loadingStates.allQueries}
								className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
								<PlayCircle className="h-4 w-4 mr-2" />
								{loadingStates.allQueries
									? "Running All Queries..."
									: "Run All Queries"}
							</Button>
						</div>
					</div>
				</div>
				{/* Key Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<MetricCard
						title="Total Supply"
						value={`${
							tokenHoldersData ? tokenHoldersData.totalSupply.toLocaleString() : "N/A"
						} ${symbol.toUpperCase()}`}
						error={tokenHoldersError ? "Failed to load total supply" : undefined}
						isLoading={tokenHoldersLoading || tokenLoading}
						subtitle={
							tokenHoldersLoading
								? "Fetching from blockchain..."
								: "Live from blockchain"
						}
					/>
					<MetricCard
						title="Contract Address"
						value={`${CONTRACT_ADDRESS.slice(0, 8)}...${CONTRACT_ADDRESS.slice(-6)}`}
						subtitle={"Token Contract address"}>
						<Button
							onClick={() => copyToClipboard(CONTRACT_ADDRESS)}
							variant="ghost"
							size="sm"
							className="text-gray-400 hover:text-white">
							{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
						</Button>
					</MetricCard>
				</div>

				{/* Charts */}
				<div className="space-y-6">
					<ChartCard
						title="Transactions"
						description={`Cumulative transaction count and total volume for ${symbol.toUpperCase()} over time.`}
						isLoading={cumulativeGrowthLoading}
						error={
							cumulativeGrowthError
								? "Failed to load cumulative growth data"
								: undefined
						}
						onRunQuery={() => runQuery("cumulativeGrowth")}
						cooldownKey="cooldown:cumulative-growth">
						<ChartAreaInteractive
							data={cumulativeGrowthData}
							isLoading={cumulativeGrowthLoading}
							symbol={symbol.toUpperCase()}
						/>
					</ChartCard>
					{uniqueWalletsData && (
						<ChartCard
							title="Unique Wallets"
							description={`Unique wallets and new wallets over time for ${symbol.toUpperCase()}.`}
							isLoading={uniqueWalletsLoading}
							error={
								uniqueWalletsError
									? "Failed to load unique wallets data"
									: undefined
							}
							onRunQuery={() => runQuery("uniqueWallets")}
							cooldownKey="cooldown:unique-wallets">
							<UniqueWalletsDisplay data={uniqueWalletsData} />
						</ChartCard>
					)}

					<ChartCard
						title="Weekly Interest Payments"
						description="Weekly interest payments: toggle between payment count, total amount paid and average payments per week."
						isLoading={weeklyPaymentsLoading}
						error={
							weeklyPaymentsError ? "Failed to load weekly payments data" : undefined
						}
						onRunQuery={() => runQuery("weeklyPayments")}
						cooldownKey="cooldown:weekly-payments">
						<WeeklyPaymentsChart
							data={weeklyPaymentsData}
							symbol={symbol.toUpperCase()}
						/>
					</ChartCard>

					<ChartCard
						title="Token Holders Distribution"
						description="Distribution of token holders by balance size categories."
						isLoading={tokenHoldersLoading}
						error={tokenHoldersError ? "Failed to load token holders data" : undefined}
						onRunQuery={() => runQuery("tokenHolders")}
						cooldownKey="cooldown:token-holders">
						<TokenHoldersPieChart
							data={tokenHoldersData}
							symbol={symbol.toUpperCase()}
							isLoading={tokenHoldersLoading}
						/>
					</ChartCard>
				</div>
			</div>
		</DashboardLayout>
	);
}
