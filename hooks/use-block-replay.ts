"use client"

import { useState, useEffect } from "react"

interface BlockData {
  number: number
  hash: string
  timestamp: number
  transactions: string[]
  gasUsed: number
  gasLimit: number
  parentHash: string
}

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  gasUsed: number
  status: number
}

interface Event {
  contractAddress: string
  eventName: string
  args: any
  transactionHash: string
}

interface StateChange {
  address: string
  slot: string
  before: string
  after: string
  type: string
}

export function useBlockReplay(blockNumber: number) {
  const [blockData, setBlockData] = useState<BlockData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [stateChanges, setStateChanges] = useState<StateChange[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (blockNumber <= 0) return

    const fetchBlockData = async () => {
      setIsLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

        // Fetch block data
        const blockResponse = await fetch(`${baseUrl}/api/blocks/${blockNumber}`)
        if (blockResponse.ok) {
          const blockData = await blockResponse.json()
          setBlockData(blockData)
        }

        // Fetch transactions for this block
        const txResponse = await fetch(`${baseUrl}/api/transactions?blockNumber=${blockNumber}`)
        if (txResponse.ok) {
          const txData = await txResponse.json()
          setTransactions(txData)
        }

        // Fetch events for this block
        const eventsResponse = await fetch(`${baseUrl}/api/events?blockNumber=${blockNumber}`)
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData)
        }

        // Fetch state changes (mock data for now)
        const stateResponse = await fetch(`${baseUrl}/api/state-changes?blockNumber=${blockNumber}`)
        if (stateResponse.ok) {
          const stateData = await stateResponse.json()
          setStateChanges(stateData)
        } else {
          // Generate mock state changes for demonstration
          setStateChanges([
            {
              address: "0x1234567890123456789012345678901234567890",
              slot: "0x0",
              before: "0x0000000000000000000000000000000000000000000000000000000000000000",
              after: "0x0000000000000000000000000000000000000000000000000000000000000001",
              type: "SSTORE",
            },
          ])
        }

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setBlockData(null)
        setTransactions([])
        setEvents([])
        setStateChanges([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlockData()
  }, [blockNumber])

  return { blockData, transactions, events, stateChanges, isLoading, error }
}
