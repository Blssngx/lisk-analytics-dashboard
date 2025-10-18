"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, YAxis, ComposedChart, ResponsiveContainer } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { WeeklyPayments } from "@/lib/generated/prisma"

export const description = "Weekly interest payments"

const chartConfig = {
  date: { label: "Time" },
  payments: { label: "Payments", color: "var(--chart-2)" },
  amounts: { label: `Total Amount`, color: "var(--chart-1)" },
  average: { label: "Average Payment", color: "var(--chart-3)" },
} satisfies ChartConfig

export function WeeklyPaymentsChart({ data, symbol }: { data?: WeeklyPayments[], symbol: string }) {
  const [timeRange, setTimeRange] = React.useState("all")
  const [activeChart, setActiveChart] = React.useState<"combined" | "amounts" | "payments" | "average">("combined")

  const safeData = Array.isArray(data) ? data : []

  function formatAmount(amount: number): number {
    if (!amount) return 0
    if (amount >= 0.001) return Number(amount.toFixed(6))
    else {
      const val = 18 - Number(String(amount).split('e')[1])
      const number = Number(`1e${val}`)
      return Number(String(Number((amount / number))).split('e')[0])
    }
  }

  const items = React.useMemo(() => {
    // First, process all data and group by week
    const weeklyData = new Map<string, { date: Date, count: number, total: number, transactions: Array<{count: number, total: number}> }>()

    safeData.forEach((i) => {
      const date = new Date(i.weekStartDate || "")
      if (isNaN(date.getTime())) return

      // Create a consistent week key using the start of the week (Monday)
      const weekStart = new Date(date)
      const dayOfWeek = weekStart.getDay()
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust for Monday start
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0) // Reset time to start of day

      const weekKey = weekStart.toISOString().split('T')[0] // Use YYYY-MM-DD as key

      const count = Number(i.paymentCount ?? 0)
      const total = Number(i.totalPaymentsAmount ?? 0)

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          date: weekStart,
          count: 0,
          total: 0,
          transactions: []
        })
      }

      const existing = weeklyData.get(weekKey)!
      existing.transactions.push({ count, total })
    })

    // Consolidate each week's data by taking the maximum values
    // (since actual data will be > 0 and zero entries will be 0)
    return Array.from(weeklyData.values())
      .map(({ date, transactions }) => {
        // Sum all non-zero counts and totals for the week
        const count = transactions.reduce((sum, t) => sum + t.count, 0)
        const total = transactions.reduce((sum, t) => sum + t.total, 0)
        const avg = count > 0 ? total / count : 0

        return { date, count, total, avg }
      })
      .filter(item => item.count > 0 || item.total > 0) // Remove weeks with no activity
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [safeData])

  const maxDate = React.useMemo(() => {
    return items.reduce((acc, p) => (p.date > acc ? p.date : acc), new Date(0))
  }, [items])

  const rechartsData = React.useMemo(
    () =>
      items.map((p) => ({
        date: p.date.toISOString(),
        payments: p.count,
        amounts: p.total,
        total: p.total,
        avg: p.avg,
      })),
    [items]
  )

  const filteredData = React.useMemo(() => {
    const referenceDate = maxDate && maxDate.getTime() > 0 ? maxDate : new Date()
    let daysToSubtract = 90
    if (timeRange === "all") return rechartsData
    else if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return rechartsData.filter((item) => new Date(item.date) >= startDate)
  }, [rechartsData, maxDate, timeRange])

  const legendStats = React.useMemo(() => {
    const payments = Number(filteredData.reduce((acc, cur) => cur.payments + acc, 0).toFixed(2))
    const totalAmount = Number(filteredData.reduce((acc, cur) => cur.amounts + acc, 0).toFixed(2))
    const averagePayment = payments > 0 ? (totalAmount / payments).toFixed(2) : 0
    return { payments, totalAmount, averagePayment }
  }, [filteredData])

  if (!filteredData.length) {
    return (
      <div className="px-2 sm:p-6">
        <div className="h-[50vh] w-full animate-pulse rounded-md bg-muted/30" />
      </div>
    )
  }

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { left: 12, right: 12, top: 5, bottom: 5 }
    }

    switch (activeChart) {
      case "combined":
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value).toFixed(0)}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value).toLocaleString()}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name) => {
                    if (name === "amounts") {
                      return [`${Number(value || 0).toFixed(2)} ${symbol}`, "Total Amount"]
                    }
                    if (name === "payments") {
                      return [`${Number(value || 0).toLocaleString()}`, "Payment Count"]
                    }
                    return `${Number(value || 0).toLocaleString()}`
                  }}
                />
              }
            />
            <Bar
              yAxisId="left"
              dataKey="amounts"
              fill="var(--color-amounts)"
              radius={[2, 2, 0, 0]}
              fillOpacity={0.8}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="payments"
              stroke="var(--color-payments)"
              strokeWidth={3}
              dot={{ fill: "var(--color-payments)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "var(--color-payments)", strokeWidth: 2 }}
            />
          </ComposedChart>
        )

      case "amounts":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value).toFixed(1)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name, item) => {
                    if (name === "amounts") {
                      const payments = item?.payload?.payments || 0
                      const avg = item?.payload?.avg || 0
                      return [
                        `${Number(value || 0).toFixed(2)} ${symbol}`,
                        `Total Amount | ${payments} payments | Avg: ${avg.toFixed(2)} ${symbol}`
                      ]
                    }
                    return `${Number(value || 0).toLocaleString()}`
                  }}
                />
              }
            />
            <Bar
              dataKey="amounts"
              fill="var(--color-amounts)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case "payments":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value).toLocaleString()}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name, item) => {
                    if (name === "payments") {
                      const total = item?.payload?.total || 0
                      const avg = item?.payload?.avg || 0
                      return [
                        `${Number(value || 0).toLocaleString()} payments`,
                        `Total: ${total.toFixed(2)} ${symbol} | Avg: ${avg.toFixed(2)} ${symbol}`
                      ]
                    }
                    return `${Number(value || 0).toLocaleString()}`
                  }}
                />
              }
            />
            <Bar
              dataKey="payments"
              fill="var(--color-payments)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case "average":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value).toFixed(2)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name, item) => {
                    if (name === "avg") {
                      const payments = item?.payload?.payments || 0
                      const total = item?.payload?.total || 0
                      return [
                        `${Number(value || 0).toFixed(4)} ${symbol}`,
                        `Average Payment | ${payments} payments | Total: ${total.toFixed(2)} ${symbol}`
                      ]
                    }
                    return `${Number(value || 0).toFixed(4)} ${symbol}`
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="var(--color-average)"
              strokeWidth={3}
              dot={{ fill: "var(--color-average)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "var(--color-average)", strokeWidth: 2 }}
            />
          </LineChart>
        )

      default:
        return <div>Hello</div>
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveChart("combined")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "combined" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
                <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-2)" }} />
              </div>
              <span>Combined</span>
            </div>
            <div className="text-foreground text-xl font-bold">
              Overview
            </div>
          </button>

          <button
            onClick={() => setActiveChart("amounts")}
            title={`a${symbol} stands for "atto${symbol}" a unit equal to 1e-18 of a ${symbol}`}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "amounts" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
              <span>Total Amount ({symbol})</span>
            </div>
            <div className="text-foreground text-xl font-bold">
              {legendStats.totalAmount.toLocaleString()}
            </div>
          </button>

          <button
            onClick={() => setActiveChart("payments")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "payments" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-2)" }} />
              <span>Payment Count</span>
            </div>
            <div className="text-foreground text-xl font-bold">
              {legendStats.payments.toLocaleString()}
            </div>
          </button>

          <button
            onClick={() => setActiveChart("average")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "average" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-3)" }} />
              <span>Average Payment ({symbol} per week)</span>
            </div>
            <div className="text-foreground text-xl font-bold">
              {Number(legendStats.averagePayment).toLocaleString()}
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
        <ChartContainer config={chartConfig} className="aspect-auto h-[50vh] w-full">
          {renderChart()}
        </ChartContainer>

        {activeChart === "combined" && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "var(--chart-1)" }} />
              <span>Bars show total payment amounts per week</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-3 rounded-sm" style={{ backgroundColor: "var(--chart-2)" }} />
              <span>Line shows number of payments per week</span>
            </div>
          </div>
        )}


      </div>
    </>
  )
}