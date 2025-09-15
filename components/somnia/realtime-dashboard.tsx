"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, Zap, AlertTriangle, Database, Play, Pause } from "lucide-react"
import MetricsChart from "./metrics-chart"
import EventStream from "./event-stream"
import ContractMonitor from "./contract-monitor"
import ReplayTimeline from "./replay-timeline"
import GasProfiler from "./gas-profiler"
import ChaosMode from "./chaos-mode"
import { useSomniaWebSocket } from "@/hooks/use-somnia-websocket"
import { useRealtimeMetrics } from "@/hooks/use-realtime-metrics"

export default function RealtimeDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [contractAddress, setContractAddress] = useState("")
  const [selectedContract, setSelectedContract] = useState<string | null>(null)

  const { socket, isConnected, events, subscribe, unsubscribe } = useSomniaWebSocket()
  const { metrics, isLoading } = useRealtimeMetrics()

  const handleStartMonitoring = () => {
    if (contractAddress && !isMonitoring) {
      subscribe(contractAddress, ["Swap", "Transfer", "LiquidityAdded"])
      setSelectedContract(contractAddress)
      setIsMonitoring(true)
    }
  }

  const handleStopMonitoring = () => {
    if (selectedContract) {
      unsubscribe(selectedContract)
      setSelectedContract(null)
      setIsMonitoring(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
            Somnia DevLab
          </h1>
          <p className="text-muted-foreground mt-2">Real-time blockchain monitoring for Somnia Network</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Connection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Contract Monitor
          </CardTitle>
          <CardDescription>Enter a contract address to start monitoring events and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="contract-address">Contract Address</Label>
              <Input
                id="contract-address"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                disabled={isMonitoring}
              />
            </div>
            <Button
              onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
              disabled={!contractAddress || !isConnected}
              variant={isMonitoring ? "destructive" : "default"}
              className="gap-2"
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Monitoring
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions Per Second</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">
              {isLoading ? "..." : metrics?.tps?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Real-time TPS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? "..." : `${metrics?.errorRate?.toFixed(1) || "0.0"}%`}
            </div>
            <p className="text-xs text-muted-foreground">Failed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {isLoading ? "..." : `${metrics?.latency?.toFixed(0) || "0"}ms`}
            </div>
            <p className="text-xs text-muted-foreground">Block time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Gas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {isLoading ? "..." : Math.round(metrics?.avgGas || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Gas per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          <TabsTrigger value="events">Event Stream</TabsTrigger>
          <TabsTrigger value="contracts">Contract Monitor</TabsTrigger>
          <TabsTrigger value="replay">Replay Timeline</TabsTrigger>
          <TabsTrigger value="profiler">Gas Profiler</TabsTrigger>
          <TabsTrigger value="chaos">Chaos Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <MetricsChart />
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <EventStream events={events} isMonitoring={isMonitoring} />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <ContractMonitor contractAddress={selectedContract} />
        </TabsContent>

        <TabsContent value="replay" className="space-y-6">
          <ReplayTimeline />
        </TabsContent>

        <TabsContent value="profiler" className="space-y-6">
          <GasProfiler contractAddress={selectedContract} />
        </TabsContent>

        <TabsContent value="chaos" className="space-y-6">
          <ChaosMode contractAddress={selectedContract} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
