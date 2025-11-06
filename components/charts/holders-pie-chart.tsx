"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardFooter } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { TokenHoldersProcessor } from "@/lib/services/token-holders-processor";
import BubbleChart from "./bubble-chart";

export interface TokenHoldersPieChartProps {
	data?: any;
	symbol?: string;
	isLoading?: boolean;
	walletsData?: Array<{
		address: string;
		balance: number;
		percentage: number;
		category: string;
	}>;
}

export const description = "Token holders distribution pie chart with bubble view";

const chartConfig = {
	count: {
		label: "Holders",
	},
	"Whales (>1%)": {
		label: "Whales (>1%)",
		color: "var(--chart-1)",
	},
	"Large (0.1-1%)": {
		label: "Large (0.1-1%)",
		color: "var(--chart-2)",
	},
	"Medium (0.01-0.1%)": {
		label: "Medium (0.01-0.1%)",
		color: "var(--chart-3)",
	},
	"Small (<0.01%)": {
		label: "Small (<0.01%)",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

// Enhanced custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
	if (active && payload?.length) {
		const data = payload[0].payload;
		return (
			<div className="rounded-lg border bg-background p-4 shadow-md min-w-[200px]">
				<div className="grid gap-2">
					<div className="flex items-center gap-2">
						<div
							className="h-3 w-3 rounded-sm"
							style={{ backgroundColor: data.fill }}
						/>
						<span className="font-medium text-sm">{data.category}</span>
					</div>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="text-muted-foreground">Holders:</div>
						<div className="font-medium">{data.count.toLocaleString()}</div>
						<div className="text-muted-foreground">Percentage:</div>
						<div className="font-medium">{data.percentage.toFixed(2)}%</div>
					</div>
				</div>
			</div>
		);
	}
	return null;
};

export function TokenHoldersPieChart({
	data,
	symbol = "Token",
	isLoading = false,
}: Readonly<TokenHoldersPieChartProps>) {
	const chartData = React.useMemo(() => {
		if (!data) return [];

		// Use the distribution data that's already processed and stored in the database
		const distribution = {
			whales: data.whaleCount || 0,
			large: data.largeCount || 0,
			medium: data.mediumCount || 0,
			small: data.smallCount || 0,
		};

		const totalHolders = data.totalHolders || 0;

		const chartData = [
			{
				category: "Whales (>1%)",
				count: distribution.whales,
				percentage: totalHolders > 0 ? (distribution.whales / totalHolders) * 100 : 0,
				fill: "var(--chart-1)",
			},
			{
				category: "Large (0.1-1%)",
				count: distribution.large,
				percentage: totalHolders > 0 ? (distribution.large / totalHolders) * 100 : 0,
				fill: "var(--chart-2)",
			},
			{
				category: "Medium (0.01-0.1%)",
				count: distribution.medium,
				percentage: totalHolders > 0 ? (distribution.medium / totalHolders) * 100 : 0,
				fill: "var(--chart-3)",
			},
			{
				category: "Small (<0.01%)",
				count: distribution.small,
				percentage: totalHolders > 0 ? (distribution.small / totalHolders) * 100 : 0,
				fill: "var(--chart-4)",
			},
		];

		return chartData.filter((item) => item.count > 0); // Only show categories with holders
	}, [data]);
	// Legend stats (latest values in the filtered range)
	// Compute legend stats for each category in the chart data
	const bubbleData = React.useMemo(() => {
		if (!data) return [];
		try {
			// Process the raw holder data using TokenHoldersProcessor
			const processedData = TokenHoldersProcessor.processHoldersData(data.holdersData, {
				decimals: 18,
			});

			if (!processedData?.holders?.length) {
				return [];
			}

			const bubbleChartData = TokenHoldersProcessor.formatForBubbleChart(processedData);
			return bubbleChartData.map((holder: any, index: number) => {
				const pct = holder?.percentage ?? 0;
				let category: string;
				if (pct > 1) {
					category = "Whales (>1%)";
				} else if (pct > 0.1) {
					category = "Large (0.1-1%)";
				} else if (pct > 0.01) {
					category = "Medium (0.01-0.1%)";
				} else {
					category = "Small (<0.01%)";
				}
				return {
					...holder,
					x: index + 1,
					z: pct * 100,
					category,
				};
			});
		} catch (error) {
			console.error("Error processing holder data:", error);
			return [];
		}
	}, [data]);

	const totalHolders = React.useMemo(() => {
		return chartData.reduce((acc, curr) => acc + curr.count, 0);
	}, [chartData]);

	if (isLoading || chartData.length === 0) {
		return (
			<div className="flex-1 pb-0">
				<div className="mx-auto aspect-square max-h-[500px] flex items-center justify-center">
					<div className="text-muted-foreground">Loading chart data...</div>
				</div>
			</div>
		);
	}

	return (
		<Card className="flex flex-col border-none">
			<div className="flex flex-col gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
					{[
						{ key: "Whales (>1%)", label: "Whales (>1%)", color: "var(--chart-1)" },
						{ key: "Large (0.1-1%)", label: "Large (0.1-1%)", color: "var(--chart-2)" },
						{
							key: "Medium (0.01-0.1%)",
							label: "Medium (0.01-0.1%)",
							color: "var(--chart-3)",
						},
						{ key: "Small (<0.01%)", label: "Small (<0.01%)", color: "var(--chart-4)" },
					].map(({ key, label, color }) => {
						const stat = chartData.find((d) => d.category === key);
						return (
							<div
								key={key}
								className="rounded-md border border-border bg-background/40 px-3 py-2 lg:px-4 lg:py-2 text-left flex flex-col gap-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<span
										className="h-2 w-2 rounded-[2px]"
										style={{ backgroundColor: color }}
									/>
									<span className="hidden lg:inline">{label}</span>
									<span className="lg:hidden">{key.split(" ")[0]}</span>
								</div>
								<div className="text-foreground text-xl font-bold">
									{stat ? stat.count.toLocaleString() : 0}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex-1 pb-0">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-[75vh] sm:h-[50vh]">
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square w-full max-w-[500px] lg:h-auto">
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={(props) => <CustomPieTooltip {...props} />}
							/>
							<Pie
								data={chartData}
								dataKey="count"
								nameKey="category"
								innerRadius={100}
								strokeWidth={3}>
								<Label
									content={({ viewBox }) => {
										if (viewBox && "cx" in viewBox && "cy" in viewBox) {
											return (
												<text
													x={viewBox.cx}
													y={viewBox.cy}
													textAnchor="middle"
													dominantBaseline="middle">
													<tspan
														x={viewBox.cx}
														y={viewBox.cy}
														className="fill-foreground text-2xl lg:text-4xl font-bold">
														{totalHolders.toLocaleString()}
													</tspan>
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) + 20}
														className="fill-muted-foreground text-sm lg:text-lg">
														Holders
													</tspan>
												</text>
											);
										}
									}}
								/>
							</Pie>
						</PieChart>
					</ChartContainer>

					<BubbleChart data={bubbleData} symbol={symbol} />
				</div>
			</div>

			<CardFooter className="flex-col gap-2 text-xs lg:text-sm px-4 lg:px-6">
				<div className="flex items-center gap-2 leading-none font-medium text-center">
					Total Supply:{" "}
					{data.totalSupply ? Number(data.totalSupply).toLocaleString() : "N/A"} {symbol}
				</div>
				<div className="text-muted-foreground leading-none text-center">
					Distribution of wallet holders by groups (left) and by individual wallet balance
					(right)
				</div>
			</CardFooter>
		</Card>
	);
}
