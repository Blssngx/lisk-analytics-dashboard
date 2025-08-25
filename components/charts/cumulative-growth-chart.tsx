"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
// Removed Card and Select UI imports since we render a custom header with legend and buttons

export const description = "An interactive area chart"

type CumulativeGrowthRow = {
  date?: string
  cumulativeTxCount?: number
  dailyTxCount?: number
  cumulativeTxAmount?: number
  dailyTxAmount?: number
}

const chartConfig = {
  date: {
    label: "Time",
  },
  desktop: {
    label: "Transaction Count",
    color: "var(--chart-1)",
  },
  mobile: {
    label: `Transaction Volume`,
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data, isLoading, symbol }: { data?: CumulativeGrowthRow[], isLoading?: boolean, symbol: string }) {
  const [timeRange, setTimeRange] = React.useState("all")
  const [activeChart, setActiveChart] = React.useState<"desktop" | "mobile" | "all">("all")

  const safeData = Array.isArray(data) ? data : []

  // Map API rows to chart points
  const points = React.useMemo(() => {
    return safeData
      .map((row) => {
        const date = new Date(row.date || "")
        if (isNaN(date.getTime())) return null
        const tx = Number(row.cumulativeTxCount ?? row.dailyTxCount ?? 0)
        const amount = Number(row.cumulativeTxAmount ?? row.dailyTxAmount ?? 0)
        return { date, tx, amount }
      })
      .filter(Boolean) as Array<{ date: Date; tx: number; amount: number }>
  }, [safeData])

  // Track latest date for time-range filtering
  const maxDate = React.useMemo(() => {
    return points.reduce((acc, p) => (p.date > acc ? p.date : acc), new Date(0))
  }, [points])

  // Build recharts data with styled keys
  const rechartsData = React.useMemo(
    () =>
      points
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((p) => ({
          date: p.date.toISOString(),
          desktop: p.tx,
          mobile: p.amount || 0,
        })),
    [points]
  )

  // Filter by time range (last 90/30/7 days from latest point)
  const filteredData = React.useMemo(() => {
    const referenceDate = maxDate && maxDate.getTime() > 0 ? maxDate : new Date()
    let daysToSubtract = 90
    if(timeRange === "all")return rechartsData;
    else if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return rechartsData.filter((item) => new Date(item.date) >= startDate)
  }, [rechartsData, maxDate, timeRange])

  // Legend stats (latest values in the filtered range)
  const legendStats = React.useMemo(() => {
    const last = filteredData.length ? filteredData[filteredData.length - 1] : undefined
    const desktop = last?.desktop ?? 0
    const mobile = last?.mobile ?? 0
    return { desktop, mobile }
  }, [filteredData])

  // Show loading skeleton if data is loading or empty
  if (isLoading || !filteredData.length) {
    return (
      <div className="px-2 sm:p-6">
        <div className="h-[50vh] w-full animate-pulse rounded-md bg-muted/30" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="grid grid-cols-3 gap-3">
        <button
            onClick={() => setActiveChart("all")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "all" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-2)" }} />
              <span>Combined</span>
            </div>
            <div className="text-foreground text-xl font-bold">
              Overview
            </div>
          </button> <button
            onClick={() => setActiveChart("desktop")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "desktop" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
              <span>{chartConfig.desktop.label}</span>
            </div>
            <div className="text-foreground text-xl font-bold">
              {legendStats.desktop.toLocaleString()}
            </div>
          </button>
          <button
            onClick={() => setActiveChart("mobile")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "mobile" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-2)" }} />
              <span>{chartConfig.mobile.label} ({symbol})</span>
            </div>
            <div className="text-foreground text-xl font-bold">
              {legendStats.mobile.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
              className="data-[active=true]:bg-muted/60 data-[active=true]:text-foreground border-border bg-background/40 text-muted-foreground hover:bg-muted/40 rounded-md border px-3 py-1.5 text-xs font-medium"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[50vh] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
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
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const val = Number(v) || 0
                if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
                if (val >= 1_000) return `${Math.round(val / 1_000)}K`
                return `${val}`
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const val = Number(v) || 0
                if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
                if (val >= 1_000) return `${Math.round(val / 1_000)}K`
                return `${val}`
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
                    })
                  }}
                  indicator="dot"
                  formatter={(value, name) => {
                    const numeric = Number(value) || 0
                    if (name === "mobile") {
                      return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })} `
                    }
                    return `${numeric.toLocaleString()}`
                  }}
                />
              }
            />
            {(activeChart === "mobile" || activeChart === "all") && (
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
                yAxisId="right"
            />
            )}
            {(activeChart === "desktop" || activeChart === "all") && (
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
                yAxisId="left"
            />
            )}
          </AreaChart>
        </ChartContainer>
        </div>
    </>
  )
}
