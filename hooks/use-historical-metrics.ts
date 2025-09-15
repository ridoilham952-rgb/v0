"use client"

import { useState, useEffect } from "react"

interface HistoricalDataPoint {
  timestamp: string
  value: number
}

export function useHistoricalMetrics(timeRange: string, metricType: string) {
  const [data, setData] = useState<HistoricalDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          timeRange,
          metricType,
        })

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/metrics/history?${params}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch historical metrics")
        }

        const rawData = await response.json()
        const formattedData = rawData.map((item: any) => ({
          timestamp: item.timestamp,
          value: Number.parseFloat(item.value),
        }))

        setData(formattedData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange, metricType])

  return { data, isLoading, error }
}
