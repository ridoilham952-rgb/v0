"use client"

import { useState, useEffect } from "react"

interface BlockInfo {
  number: number
  hash: string
  timestamp: number
  transactionCount: number
}

export function useBlockRange(startBlock: number, endBlock: number) {
  const [blockRange, setBlockRange] = useState<BlockInfo[]>([])
  const [latestBlock, setLatestBlock] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch latest block number
  useEffect(() => {
    const fetchLatestBlock = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/blocks/latest`)
        if (response.ok) {
          const data = await response.json()
          setLatestBlock(data.blockNumber)
        }
      } catch (err) {
        console.error("Error fetching latest block:", err)
      }
    }

    fetchLatestBlock()
    const interval = setInterval(fetchLatestBlock, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Fetch block range
  useEffect(() => {
    if (startBlock >= endBlock) return

    const fetchBlockRange = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/blocks/range?start=${startBlock}&end=${endBlock}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch block range")
        }

        const data = await response.json()
        setBlockRange(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setBlockRange([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlockRange()
  }, [startBlock, endBlock])

  return { blockRange, latestBlock, isLoading, error }
}
