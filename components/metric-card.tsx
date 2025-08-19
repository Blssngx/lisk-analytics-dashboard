"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  isLoading?: boolean
  onRunQuery?: () => void,
  children?: React.ReactNode
}

export function MetricCard({ title, value, subtitle, isLoading, onRunQuery,children}: MetricCardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        {onRunQuery && (
          <Button
            onClick={onRunQuery}
            disabled={isLoading}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
          >
            <Play className="h-3 w-3 mr-1" />
            Run Query
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {isLoading ? <div className="animate-pulse bg-gray-700 h-8 w-24 rounded"></div> : value}
        </div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {!!children && children}
      </CardContent>
    </Card>
  )
}
