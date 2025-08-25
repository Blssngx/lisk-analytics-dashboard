"use client"

import * as React from "react"
import { TrendingUp, Users, Wallet } from "lucide-react"
import { Label, Pie, PieChart, ScatterChart, Scatter, XAxis, YAxis, ZAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { TokenHoldersProcessor } from "@/lib/services/token-holders-processor"
import BubbleChart from "./bubble-chart"

export interface TokenHoldersPieChartProps {
  data?: any
  symbol?: string
  isLoading?: boolean
  walletsData?: Array<{
    address: string
    balance: number
    percentage: number
    category: string
  }>
}

export const description = "Token holders distribution pie chart with bubble view"

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
} satisfies ChartConfig

// Enhanced custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
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
    )
  }
  return null
}

// Custom tooltip for bubble chart
const CustomBubbleTooltip = ({ active, payload, symbol }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border bg-background p-4 shadow-md min-w-[250px]">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="font-medium text-sm">Wallet Details</span>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-mono text-xs">{`${data.address.slice(0, 6)}...${data.address.slice(-4)}`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-mono font-medium">{data.balance.toLocaleString()} {symbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">% of Supply:</span>
              <span className="font-mono font-medium">{data.percentage.toFixed(4)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryStyle(data.category)}`}>
                {data.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Helper function to get category styling
const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'Whales (>1%)':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'Large (0.1-1%)':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'Medium (0.01-0.1%)':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'Small (<0.01%)':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}


export function TokenHoldersPieChart({ 
  data, 
  symbol = "Token", 
  isLoading = false,
  walletsData = []
}: TokenHoldersPieChartProps) {
  const [activeView, setActiveView] = React.useState<'distribution' | 'wallets' | 'both'>('both')

  const chartData = React.useMemo(() => {
    if (!data) return []
    
    // Use the distribution data that's already processed and stored in the database
    const distribution = {
      whales: data.whaleCount || 0,
      large: data.largeCount || 0,
      medium: data.mediumCount || 0,
      small: data.smallCount || 0
    }
    
    const totalHolders = data.totalHolders || 0
    
    const chartData = [
      {
        category: "Whales (>1%)",
        count: distribution.whales,
        percentage: totalHolders > 0 ? (distribution.whales / totalHolders) * 100 : 0,
        fill: "var(--chart-1)"
      },
      {
        category: "Large (0.1-1%)",
        count: distribution.large,
        percentage: totalHolders > 0 ? (distribution.large / totalHolders) * 100 : 0,
        fill: "var(--chart-2)"
      },
      {
        category: "Medium (0.01-0.1%)",
        count: distribution.medium,
        percentage: totalHolders > 0 ? (distribution.medium / totalHolders) * 100 : 0,
        fill: "var(--chart-3)"
      },
      {
        category: "Small (<0.01%)",
        count: distribution.small,
        percentage: totalHolders > 0 ? (distribution.small / totalHolders) * 100 : 0,
        fill: "var(--chart-4)"
      }
    ]
    
    return chartData.filter(item => item.count > 0) // Only show categories with holders
  }, [data])
 // Legend stats (latest values in the filtered range)
 // Compute legend stats for each category in the chart data
 const legendStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    chartData.forEach(item => {
      stats[item.category] = item.count;
    });
    const total = chartData.reduce((sum, item) => sum + (item.count || 0), 0);
    return { ...stats, total };
  }, [chartData]);
  const bubbleData = React.useMemo(() => {
    if(!data) return []
    try {
     
      
      // Process the raw holder data using TokenHoldersProcessor
     const processedData = TokenHoldersProcessor.processHoldersData(data.holdersData, { decimals: 18 })
      
      if (!processedData || !processedData.holders || processedData.holders.length === 0) {
    
        return []
      }
      
      const bubbleChartData = TokenHoldersProcessor.formatForBubbleChart(processedData)
      return bubbleChartData
        .map((holder: any, index: number) => ({
          ...holder,
          x: index + 1,
          z: holder.percentage * 100,
          category: holder.percentage > 1 
            ? 'Whales (>1%)' 
            : holder.percentage > 0.1 
            ? 'Large (0.1-1%)' 
            : holder.percentage > 0.01 
            ? 'Medium (0.01-0.1%)' 
            : 'Small (<0.01%)'
        }))
    } catch (error) {
      console.error('Error processing holder data:', error)
      return []
    }
  }, [data?.holdersData])


  const totalHolders = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  if (isLoading || chartData.length === 0) {
    return (
      
        <div className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[500px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </div>
     
    )
  }

  return (
    <Card className="flex flex-col border-none">
     <div className="flex flex-col gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          {[
            { key: "Whales (>1%)", label: "Whales (>1%)", color: "var(--chart-1)" },
            { key: "Large (0.1-1%)", label: "Large (0.1-1%)", color: "var(--chart-2)" },
            { key: "Medium (0.01-0.1%)", label: "Medium (0.01-0.1%)", color: "var(--chart-3)" },
            { key: "Small (<0.01%)", label: "Small (<0.01%)", color: "var(--chart-4)" },
          ].map(({ key, label, color }) => {
            const stat = chartData.find((d) => d.category === key);
            return (
              <div
                key={key}
                className="rounded-md border border-border bg-background/40 px-3 py-2 lg:px-4 lg:py-2 text-left flex flex-col gap-1"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
                  <span className="hidden lg:inline">{label}</span>
                  <span className="lg:hidden">{key.split(' ')[0]}</span>
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
               className="mx-auto aspect-square w-full max-w-[500px] lg:h-auto"
        >
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
                   strokeWidth={3}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                               className="fill-foreground text-2xl lg:text-4xl font-bold"
                        >
                               {totalHolders.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                               y={(viewBox.cy || 0) + 20}
                               className="fill-muted-foreground text-sm lg:text-lg"
                        >
                               Holders
                        </tspan>
                      </text>
                    )
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
           Total Supply: {data.totalSupply ? Number(data.totalSupply).toLocaleString() : 'N/A'} {symbol}
        </div>
         <div className="text-muted-foreground leading-none text-center">
           Distribution of wallet holders by groups (left) and by individual wallet balance (right)
        </div>
      </CardFooter>
    </Card>
  )
}
