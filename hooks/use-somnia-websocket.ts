"use client"

import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

interface Event {
  id: string
  contractAddress: string
  eventName: string
  args: any
  blockNumber: number
  transactionHash: string
  timestamp: Date
}

export function useSomniaWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      transports: ["websocket"],
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Somnia DevLab backend")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from Somnia DevLab backend")
      setIsConnected(false)
    })

    socketInstance.on("event", (eventData) => {
      const newEvent: Event = {
        id: `${eventData.transactionHash}-${Date.now()}`,
        contractAddress: eventData.contractAddress,
        eventName: eventData.eventName,
        args: eventData.args,
        blockNumber: eventData.blockNumber,
        transactionHash: eventData.transactionHash,
        timestamp: new Date(eventData.timestamp),
      }

      setEvents((prev) => [newEvent, ...prev].slice(0, 100)) // Keep last 100 events
    })

    socketInstance.on("metrics", (metricsData) => {
      console.log("Received metrics:", metricsData)
      // Handle metrics updates if needed
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const subscribe = useCallback(
    (contractAddress: string, eventTypes: string[]) => {
      if (socket) {
        socket.emit("subscribe", { contractAddress, eventTypes })
      }
    },
    [socket],
  )

  const unsubscribe = useCallback(
    (contractAddress: string) => {
      if (socket) {
        socket.emit("unsubscribe", { contractAddress })
      }
    },
    [socket],
  )

  return {
    socket,
    isConnected,
    events,
    subscribe,
    unsubscribe,
  }
}
