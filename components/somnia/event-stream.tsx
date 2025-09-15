"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Activity, Clock, Hash, User, Trash2 } from "lucide-react"

interface Event {
  id: string
  contractAddress: string
  eventName: string
  args: any
  blockNumber: number
  transactionHash: string
  timestamp: Date
}

interface EventStreamProps {
  events: Event[]
  isMonitoring: boolean
}

export default function EventStream({ events, isMonitoring }: EventStreamProps) {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEventType, setSelectedEventType] = useState<string>("all")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedEventType === "all") {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter((event) => event.eventName === selectedEventType))
    }
  }, [events, selectedEventType])

  useEffect(() => {
    // Auto-scroll to bottom when new events arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [filteredEvents])

  const clearEvents = () => {
    setFilteredEvents([])
  }

  const getEventTypeColor = (eventName: string) => {
    switch (eventName) {
      case "Transfer":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Swap":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "LiquidityAdded":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "TokensMinted":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "TokensBurned":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const formatEventArgs = (args: any) => {
    if (!args) return {}

    const formatted: Record<string, any> = {}
    Object.keys(args).forEach((key) => {
      if (isNaN(Number(key))) {
        // Skip numeric indices, only show named parameters
        formatted[key] = args[key]
      }
    })
    return formatted
  }

  const uniqueEventTypes = Array.from(new Set(events.map((e) => e.eventName)))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Event Stream
            </CardTitle>
            <CardDescription>
              Real-time contract events {isMonitoring ? "(monitoring active)" : "(monitoring stopped)"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value="all">All Events</option>
              {uniqueEventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={clearEvents} className="gap-1 bg-transparent">
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96" ref={scrollAreaRef}>
          {filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {isMonitoring ? "Waiting for events..." : "Start monitoring to see events"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div key={`${event.transactionHash}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getEventTypeColor(event.eventName)}>{event.eventName}</Badge>
                      <span className="text-sm text-muted-foreground">Block #{event.blockNumber}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {event.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-xs">
                        {event.contractAddress.slice(0, 6)}...{event.contractAddress.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-xs">
                        {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}
                      </span>
                    </div>
                  </div>

                  {Object.keys(formatEventArgs(event.args)).length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <div className="font-medium mb-2">Event Data:</div>
                      <div className="space-y-1 font-mono text-xs">
                        {Object.entries(formatEventArgs(event.args)).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="break-all">
                              {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {index < filteredEvents.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
