"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface DonutChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  title?: string
}

export function DonutChart({ data, title }: DonutChartProps) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : []

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm font-medium">{data.name}</p>
          <p className="text-white text-sm">
            {`${data.value.toLocaleString()} (${((data.value / data.total) * 100).toFixed(1)}%)`}
          </p>
        </div>
      )
    }
    return null
  }

  const total = safeData.reduce((sum, entry) => sum + entry.value, 0)
  const dataWithTotal = safeData.map((entry) => ({ ...entry, total }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {dataWithTotal.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
