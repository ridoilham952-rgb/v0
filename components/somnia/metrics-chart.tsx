"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { useHistoricalMetrics } from "@/hooks/use-historical-metrics"

export default function MetricsChart() {
  const [timeRange, setTimeRange] = useState("1h")
  const [metricType, setMetricType] = useState("tps")
  const { data, isLoading, error } = useHistoricalMetrics(timeRange, metricType)

  const formatValue = (value: number) => {
    switch (metricType) {
      case "tps":
        return value.toFixed(2)
      case "error_rate":
        return `${value.toFixed(1)}%`
      case "latency":
        return `${value.toFixed(0)}ms`
      case "avg_gas":
        return Math.round(value).toLocaleString()
      default:
        return value.toString()
    }
  }

  const getChartColor = () => {
    switch (metricType) {
      case "tps":
        return "hsl(var(--chart-1))"
      case "error_rate":
        return "hsl(var(--destructive))"
      case "latency":
        return "hsl(var(--chart-2))"
      case "avg_gas":
        return "hsl(var(--chart-3))"
      default:
        return "hsl(var(--primary))"
    }
  }

  const getMetricLabel = () => {
    switch (metricType) {
      case "tps":
        return "Transactions Per Second"
      case "error_rate":
        return "Error Rate (%)"
      case "latency":
        return "Average Latency (ms)"
      case "avg_gas":
        return "Average Gas Usage"
      default:
        return "Metric"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Metrics Chart</CardTitle>
            <CardDescription>Real-time blockchain performance metrics</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tps">TPS</SelectItem>
                <SelectItem value="error_rate">Error Rate</SelectItem>
                <SelectItem value="latency">Latency</SelectItem>
                <SelectItem value="avg_gas">Average Gas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">5 minutes</SelectItem>
                <SelectItem value="15m">15 minutes</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="6h">6 hours</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading metrics...</div>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-destructive">Error loading metrics: {error}</div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  className="text-xs"
                />
                <YAxis tickFormatter={formatValue} className="text-xs" />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [formatValue(value), getMetricLabel()]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={getChartColor()}
                  fill={getChartColor()}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
