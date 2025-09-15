"use client"

import { useState, useEffect } from "react"

interface RealtimeMetrics {
  tps: number
  errorRate: number
  latency: number
  avgGas: number
  timestamp: Date
}

export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/metrics/realtime`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch metrics")
        }

        const data = await response.json()
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch immediately
    fetchMetrics()

    // Then fetch every 5 seconds
    const interval = setInterval(fetchMetrics, 5000)

    return () => clearInterval(interval)
  }, [])

  return { metrics, isLoading, error }
}
