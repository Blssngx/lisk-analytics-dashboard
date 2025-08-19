"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Weekly interest payments"

type WeeklyPaymentsRow = {
  weekStartDate?: string
  totalPaymentsAmount?: number
  paymentCount?: number
  averagePayment?: number
}

const chartConfig = {
  date: { label: "Time" },
  payments: { label: "Payments", color: "var(--chart-2)" },
  amounts: { label: "Total Amount", color: "var(--chart-1)" },
} satisfies ChartConfig

export function WeeklyPaymentsChart({ data }: { data?: WeeklyPaymentsRow[] }) {
  const [timeRange, setTimeRange] = React.useState("all")
  const [activeChart, setActiveChart] = React.useState<"payments" | "amounts">("payments")
// console.log(data)
  const safeData = Array.isArray(data) ? data : []

  const items = React.useMemo(() => {
    return safeData
      .map((i) => {
        const date = new Date( i.weekStartDate || "")
        // if (isNaN(date.getTime())) return null
        const count = Number(i.paymentCount ?? 0)
        const total = Number(i.totalPaymentsAmount ?? 0)
        const avg = Number(i.averagePayment ?? (count > 0 ? total / count : 0))
        return { date, count, total, avg }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime()) as Array<{
      date: Date
      count: number
      total: number
      avg: number
    }>
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
  
  // console.log(filteredData)
  const legendStats = React.useMemo(() => {
    const payments = filteredData.reduce((acc, cur) => cur.payments + acc, 0)
    const totalAmount = filteredData.reduce((acc, cur) => cur.amounts + acc, 0)
    return { payments, totalAmount }
  }, [filteredData])

  if (!filteredData.length) {
    return (
      <div className="px-2 sm:p-6">
        <div className="h-[50vh] w-full animate-pulse rounded-md bg-muted/30" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveChart("payments")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "payments" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-2)" }} />
              <span>{chartConfig.payments.label}</span>
            </div>
            <div className="text-foreground text-2xl font-bold">
              {legendStats.payments.toLocaleString()}
            </div>
          </button>
          <button
            onClick={() => setActiveChart("amounts")}
            className={`rounded-md border border-border bg-background/40 px-4 py-2 text-left transition-colors ${
              activeChart === "amounts" ? "bg-muted/60" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
              <span>{chartConfig.amounts.label}</span>
            </div>
            <div className="text-foreground text-2xl font-bold">
              {legendStats.totalAmount}
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
          {activeChart === "payments" ? (
            <BarChart accessibilityLayer data={filteredData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
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
                        return (
                          `${Number(value || 0).toLocaleString()} payments` +
                          (total ? ` | Total: ${total} ` : "") +
                          (avg ? ` | Avg: ${avg}` : "")
                        )
                      }
                      return `${Number(value || 0).toLocaleString()}`
                    }}
                  />
                }
              />
              <Bar dataKey="payments" fill={`var(--color-payments)`} />
            </BarChart>
          ) : (
            <LineChart data={filteredData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
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
                tickFormatter={(value) => {
                  const num = Number(value)
                  return String(num)
                }}
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
                        const num = Number(value || 0)
                        return `${num}`
                      }
                      return `${Number(value || 0).toLocaleString()}`
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="amounts"
                stroke="var(--color-amounts)"
                strokeWidth={2}
                dot={{ fill: "var(--color-amounts)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ChartContainer>
      </div>
    </>
  )
}
