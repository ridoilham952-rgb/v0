"use client"

import { useState, useEffect } from "react"

interface ContractEvent {
  event_name: string
  block_number: number
  timestamp: string
  event_data: any
}

interface Transaction {
  transaction_hash: string
  block_number: number
  gas_used: string
  status: number
  timestamp: string
}

interface GasProfile {
  function_name: string
  avg_gas: number
  call_count: number
  avg_execution_time: number
}

export function useContractData(contractAddress: string | null) {
  const [events, setEvents] = useState<ContractEvent[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [gasProfile, setGasProfile] = useState<GasProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!contractAddress) {
      setEvents([])
      setTransactions([])
      setGasProfile([])
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

        // Fetch events
        const eventsResponse = await fetch(`${baseUrl}/api/events?contractAddress=${contractAddress}&limit=50`)
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData)
        }

        // Fetch transactions
        const transactionsResponse = await fetch(`${baseUrl}/api/transactions?limit=50`)
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactions(transactionsData)
        }

        // Fetch gas profile
        const gasResponse = await fetch(`${baseUrl}/api/profiling?contractAddress=${contractAddress}`)
        if (gasResponse.ok) {
          const gasData = await gasResponse.json()
          setGasProfile(gasData)
        }
      } catch (error) {
        console.error("Error fetching contract data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [contractAddress])

  return { events, transactions, gasProfile, isLoading }
}
