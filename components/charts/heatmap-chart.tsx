"use client"

interface HeatmapChartProps {
  data: Array<{
    day: string
    hour: number
    value: number
  }>
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : []
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getIntensity = (value: number) => {
    const max = Math.max(...safeData.map((d) => d.value), 1) // Ensure max is at least 1
    const intensity = value / max
    return `rgba(16, 185, 129, ${intensity})`
  }

  const getValue = (day: string, hour: number) => {
    const item = safeData.find((d) => d.day === day && d.hour === hour)
    return item ? item.value : 0
  }

  return (
    <div className="h-64 p-4">
      <div className="grid grid-cols-25 gap-1 h-full">
        {/* Hour labels */}
        <div></div>
        {hours.map((hour) => (
          <div key={hour} className="text-xs text-gray-400 text-center">
            {hour % 6 === 0 ? hour : ""}
          </div>
        ))}

        {/* Heatmap grid */}
        {days.map((day) => (
          <>
            <div key={day} className="text-xs text-gray-400 flex items-center justify-end pr-2">
              {day}
            </div>
            {hours.map((hour) => {
              const value = getValue(day, hour)
              return (
                <div
                  key={`${day}-${hour}`}
                  className="rounded-sm border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                  style={{ backgroundColor: getIntensity(value) }}
                  title={`${day} ${hour}:00 - ${value} transactions`}
                />
              )
            })}
          </>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex space-x-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
            <div
              key={intensity}
              className="w-3 h-3 rounded-sm border border-gray-800"
              style={{ backgroundColor: `rgba(16, 185, 129, ${intensity})` }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
