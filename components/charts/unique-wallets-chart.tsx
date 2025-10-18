"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { DailyUniqueWallets } from "@/lib/generated/prisma/wasm";

export const description = "Unique wallets over time";

type UniqueWalletsRow = {
	date?: string;
	uniqueWalletCount?: number;
	newWallets?: number;
	activeWallets?: number;
};

const chartConfig = {
	date: { label: "Time" },
	wallets: { label: "Unique Wallets", color: "var(--chart-1)" },
	newWallets: { label: "New Wallets", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface UniqueWalletsDisplayProps {
	data: DailyUniqueWallets[];
}

export function UniqueWalletsDisplay({ data }: Readonly<UniqueWalletsDisplayProps>) {
	const [timeRange, setTimeRange] = React.useState("all");
	const [activeChart, setActiveChart] = React.useState<"wallets" | "newWallets" | "all">("all");

	const safeData = Array.isArray(data) ? data : [];

	const items = React.useMemo(() => {
		return safeData
			.map((row) => {
				const date = new Date(row.date || "");
				if (Number.isNaN(date.getTime())) return null;
				const wallets = Number(row.uniqueWalletCount ?? 0);
				const newWallets = Number(row.newWallets ?? 0);
				return { date, wallets, newWallets };
			})
			.filter(Boolean)
			.sort((a: any, b: any) => a.date.getTime() - b.date.getTime()) as Array<{
			date: Date;
			wallets: number;
			newWallets: number;
		}>;
	}, [safeData]);

	const maxDate = React.useMemo(() => {
		return items.reduce(
			(acc, p) => new Date(Math.max(acc.getTime(), p.date.getTime())),
			new Date(0),
		);
	}, [items]);

	const rechartsData = React.useMemo(
		() =>
			items.map((p) => ({
				date: p.date.toISOString(),
				wallets: p.wallets,
				newWallets: p.newWallets,
			})),
		[items],
	);

	const filteredData = React.useMemo(() => {
		const referenceDate = maxDate && maxDate.getTime() > 0 ? maxDate : new Date();
		let daysToSubtract = 90;
		if (timeRange === "all") return rechartsData;
		else if (timeRange === "30d") daysToSubtract = 30;
		else if (timeRange === "7d") daysToSubtract = 7;
		const startDate = new Date(referenceDate);
		startDate.setDate(startDate.getDate() - daysToSubtract);
		return rechartsData.filter((item) => new Date(item.date) >= startDate);
	}, [rechartsData, maxDate, timeRange]);

	const legendStats = React.useMemo(() => {
		const last = filteredData.at(-1);
		const wallets =
			rechartsData.length === filteredData.length
				? last?.wallets ?? 0
				: (last?.wallets ?? 0) - filteredData[0].wallets;
		const newWallets = filteredData.reduce((acc, cur) => cur.newWallets + acc, 0);
		return { wallets, newWallets };
	}, [filteredData, rechartsData]);

	// Calculate the max value for newWallets in the filtered data
	const newWalletsMax = React.useMemo(() => {
		return filteredData.reduce((max, d) => {
			const val = typeof d.newWallets === "number" ? d.newWallets : 0;
			return Math.max(max, val);
		}, 0);
	}, [filteredData]);

	// Reduce the scaling of the newWallets axis by multiplying the max by a factor (e.g., 0.5)
	const newWalletsDomain = React.useMemo(() => {
		if (newWalletsMax === 0) return [0, 1];
		return [0, Math.max(1, Math.ceil(newWalletsMax))];
	}, [newWalletsMax]);

	if (!filteredData.length) {
		return (
			<div className="px-2 sm:p-6">
				<div className="h-[50vh] w-full animate-pulse rounded-md bg-muted/30" />
			</div>
		);
	}

	return (
		<div className="rounded-xl">
			<div className="flex flex-col gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="grid grid-cols-3 gap-3">
					<button
						onClick={() => setActiveChart("all")}
						className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
							activeChart === "all" ? "bg-muted/60" : "hover:bg-muted/40"
						}`}>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span
								className="h-2 w-2 rounded-[2px]"
								style={{ backgroundColor: "var(--chart-1)" }}
							/>
							<span
								className="h-2 w-2 rounded-[2px]"
								style={{ backgroundColor: "var(--chart-2)" }}
							/>
							<span>Combined</span>
						</div>
						<div className="text-foreground text-xl font-bold">Overview</div>
					</button>
					<button
						onClick={() => setActiveChart("wallets")}
						className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
							activeChart === "wallets" ? "bg-muted/60" : "hover:bg-muted/40"
						}`}>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span
								className="h-2 w-2 rounded-[2px]"
								style={{ backgroundColor: "var(--chart-1)" }}
							/>
							<span>{chartConfig.wallets.label}</span>
						</div>
						<div className="text-foreground text-xl font-bold">
							{legendStats.wallets.toLocaleString()}
						</div>
					</button>
					<button
						onClick={() => setActiveChart("newWallets")}
						className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
							activeChart === "newWallets" ? "bg-muted/60" : "hover:bg-muted/40"
						}`}>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span
								className="h-2 w-2 rounded-[2px]"
								style={{ backgroundColor: "var(--chart-2)" }}
							/>
							<span>{chartConfig.newWallets.label}</span>
						</div>
						<div className="text-foreground text-xl font-bold">
							{legendStats.newWallets.toLocaleString()}
						</div>
					</button>
				</div>
				<div className="flex items-center gap-2">
					{[
						{ key: "all", label: "All" },
						{ key: "90d", label: "90d" },
						{ key: "30d", label: "30d" },
						{ key: "7d", label: "7d" },
					].map(({ key, label }) => (
						<button
							key={key}
							type="button"
							data-active={timeRange === key}
							onClick={() => setTimeRange(key)}
							className="data-[active=true]:bg-muted/60 data-[active=true]:text-foreground border-border bg-background/40 text-muted-foreground hover:bg-muted/40 rounded-md border px-3 py-1.5 text-xs font-medium">
							{label}
						</button>
					))}
				</div>
			</div>
			<div className="px-2 sm:p-6">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[50vh] w-full overflow-hidden">
					<AreaChart
						data={filteredData}
						margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
						className="h-[50vh] overflow-hidden">
						<defs>
							<linearGradient id="fillWallets" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-wallets)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-wallets)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient id="fillNewWallets" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-newWallets)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-newWallets)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<YAxis
							yAxisId="left"
							tickLine={false}
							axisLine={false}
							tickFormatter={(v) => {
								const val = Number(v) || 0;
								if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
								if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
								return `${val}`;
							}}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							domain={newWalletsDomain}
							tickFormatter={(v) => {
								const val = Number(v) || 0;
								if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
								if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
								return `${val}`;
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									labelFormatter={(value) => {
										return new Date(value).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										});
									}}
									indicator="dot"
									formatter={(value, name) => {
										const numeric = Number(value) || 0;
										if (name === "wallets") {
											return `${numeric.toLocaleString()} unique wallets`;
										}
										if (name === "newWallets") {
											return `${numeric.toLocaleString()} new wallets`;
										}
										return `${numeric.toLocaleString()}`;
									}}
								/>
							}
						/>
						{(activeChart === "wallets" || activeChart === "all") && (
							<Area
								dataKey="wallets"
								type="monotone"
								fill="url(#fillWallets)"
								stroke="var(--color-wallets)"
								yAxisId="left"
								baseValue={0}
							/>
						)}
						{(activeChart === "newWallets" || activeChart === "all") && (
							<Area
								dataKey="newWallets"
								type="monotone"
								fill="url(#fillNewWallets)"
								stroke="var(--color-newWallets)"
								yAxisId="right"
								baseValue={0}
								connectNulls
							/>
						)}
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	);
}
