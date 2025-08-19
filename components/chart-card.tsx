"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useEffect, useState } from "react"

interface ChartCardProps {
  title: string
  children: React.ReactNode
  isLoading?: boolean
  onRunQuery?: () => void
  cooldownKey?: string
}

export function ChartCard({ title, children, isLoading, onRunQuery, cooldownKey }: ChartCardProps) {
  const COOLDOWN_MS = 5 * 60 * 1000
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const update = () => {
      if (!cooldownKey) { setRemaining(0); return }
      const last = Number(localStorage.getItem(cooldownKey) || 0)
      const diff = Date.now() - last
      const left = Math.max(0, COOLDOWN_MS - diff)
      setRemaining(Math.ceil(left / 1000))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [cooldownKey])

  const disabled = isLoading || (remaining > 0)
  const label = remaining > 0
    ? `Wait ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`
    : 'Run Query'
  return (
    <Card className="rounded-xl ">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row ">
      <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div>
        {onRunQuery && (
          <Button
            onClick={onRunQuery}
            disabled={disabled}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            {label}
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? <div className="animate-pulse bg-gray-700 h-64 w-full rounded"></div> : children}
      </CardContent>
    </Card>
  )
}
