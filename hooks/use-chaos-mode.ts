"use client"

import { useState, useEffect } from "react"

interface TestConfig {
  testType: string
  transactionCount: number
  concurrency: number
  gasLimit: number
  value: string
  duration: number
  enableReentrancy: boolean
  enableRevertLoop: boolean
  enableGasBomb: boolean
}

interface CurrentTest {
  id: string
  completed: number
  successful: number
  failed: number
  progress: number
  elapsedTime: number
  tps: number
  avgLatency: number
  errorRate: number
  avgGas: number
}

interface TestResult {
  test_name: string
  total_transactions: number
  successful_transactions: number
  failed_transactions: number
  average_tps: number
  average_latency_ms: number
  test_duration_seconds: number
  started_at: string
  completed_at: string
}

interface LiveMetric {
  timestamp: string
  tps: number
  errorRate: number
  latency: number
}

export function useChaosMode() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<CurrentTest | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([])

  const startTest = async (contractAddress: string, config: TestConfig) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/stress-test/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractAddress, testConfig: config }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        setIsRunning(true)

        // Initialize current test
        setCurrentTest({
          id: data.testId,
          completed: 0,
          successful: 0,
          failed: 0,
          progress: 0,
          elapsedTime: 0,
          tps: 0,
          avgLatency: 0,
          errorRate: 0,
          avgGas: 0,
        })

        // Start monitoring
        startTestMonitoring(data.testId, config)
      }
    } catch (error) {
      console.error("Error starting chaos test:", error)
    }
  }

  const stopTest = () => {
    setIsRunning(false)
    setCurrentTest(null)
  }

  const startTestMonitoring = (testId: string, config: TestConfig) => {
    const startTime = Date.now()

    const interval = setInterval(() => {
      if (!isRunning) {
        clearInterval(interval)
        return
      }

      const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
      const progress = Math.min(100, (elapsedTime / config.duration) * 100)

      // Simulate test progress
      const completed = Math.floor((progress / 100) * config.transactionCount)
      const successful = Math.floor(completed * (0.85 + Math.random() * 0.1)) // 85-95% success rate
      const failed = completed - successful
      const tps = completed / Math.max(1, elapsedTime)
      const avgLatency = 50 + Math.random() * 200 // 50-250ms
      const errorRate = (failed / Math.max(1, completed)) * 100
      const avgGas = 50000 + Math.random() * 100000 // 50k-150k gas

      setCurrentTest({
        id: testId,
        completed,
        successful,
        failed,
        progress,
        elapsedTime,
        tps,
        avgLatency,
        errorRate,
        avgGas,
      })

      // Add live metrics
      setLiveMetrics((prev) => [
        ...prev.slice(-50), // Keep last 50 points
        {
          timestamp: new Date().toISOString(),
          tps,
          errorRate,
          latency: avgLatency,
        },
      ])

      // Complete test
      if (progress >= 100) {
        setIsRunning(false)

        // Add to results
        const result: TestResult = {
          test_name: `${config.testType} Test`,
          total_transactions: config.transactionCount,
          successful_transactions: successful,
          failed_transactions: failed,
          average_tps: tps,
          average_latency_ms: Math.round(avgLatency),
          test_duration_seconds: elapsedTime,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
        }

        setTestResults((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10 results
        setCurrentTest(null)
        clearInterval(interval)
      }
    }, 1000)
  }

  const getTestHistory = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/stress-test/results`,
      )

      if (response.ok) {
        const data = await response.json()
        setTestResults(data)
      }
    } catch (error) {
      console.error("Error fetching test history:", error)
    }
  }

  useEffect(() => {
    getTestHistory()
  }, [])

  return {
    isRunning,
    currentTest,
    testResults,
    liveMetrics,
    startTest,
    stopTest,
    getTestHistory,
  }
}
