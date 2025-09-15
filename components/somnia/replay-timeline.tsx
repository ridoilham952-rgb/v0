"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Search,
  Clock,
  Hash,
  Database,
  Activity,
  TrendingUp,
} from "lucide-react"
import { useBlockRange } from "@/hooks/use-block-range"
import { useBlockReplay } from "@/hooks/use-block-replay"

export default function ReplayTimeline() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBlock, setCurrentBlock] = useState<number>(0)
  const [startBlock, setStartBlock] = useState<number>(0)
  const [endBlock, setEndBlock] = useState<number>(100)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [searchBlock, setSearchBlock] = useState("")

  const { blockRange, latestBlock, isLoading: rangeLoading } = useBlockRange(startBlock, endBlock)
  const { blockData, transactions, events, stateChanges, isLoading: replayLoading } = useBlockReplay(currentBlock)

  // Initialize with latest blocks
  useEffect(() => {
    if (latestBlock && startBlock === 0) {
      const start = Math.max(0, latestBlock - 100)
      const end = latestBlock
      setStartBlock(start)
      setEndBlock(end)
      setCurrentBlock(start)
    }
  }, [latestBlock, startBlock])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentBlock((prev) => {
        if (prev >= endBlock) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / playbackSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, endBlock, playbackSpeed])

  const handlePlay = () => setIsPlaying(!isPlaying)
  const handleReset = () => {
    setCurrentBlock(startBlock)
    setIsPlaying(false)
  }
  const handleStepBack = () => setCurrentBlock((prev) => Math.max(startBlock, prev - 1))
  const handleStepForward = () => setCurrentBlock((prev) => Math.min(endBlock, prev + 1))

  const handleSliderChange = (value: number[]) => {
    setCurrentBlock(value[0])
    setIsPlaying(false)
  }

  const handleBlockSearch = () => {
    const blockNum = Number.parseInt(searchBlock)
    if (!isNaN(blockNum) && blockNum >= startBlock && blockNum <= endBlock) {
      setCurrentBlock(blockNum)
      setIsPlaying(false)
    }
  }

  const handleRangeUpdate = () => {
    if (startBlock < endBlock) {
      setCurrentBlock(startBlock)
      setIsPlaying(false)
    }
  }

  const progress = endBlock > startBlock ? ((currentBlock - startBlock) / (endBlock - startBlock)) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Blockchain Replay Timeline
          </CardTitle>
          <CardDescription>Scrub through block history and inspect state changes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Block Range Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-block">Start Block</Label>
              <Input
                id="start-block"
                type="number"
                value={startBlock}
                onChange={(e) => setStartBlock(Number.parseInt(e.target.value) || 0)}
                placeholder="Start block number"
              />
            </div>
            <div>
              <Label htmlFor="end-block">End Block</Label>
              <Input
                id="end-block"
                type="number"
                value={endBlock}
                onChange={(e) => setEndBlock(Number.parseInt(e.target.value) || 100)}
                placeholder="End block number"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleRangeUpdate} disabled={rangeLoading} className="w-full">
                Update Range
              </Button>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Block #{startBlock}</span>
              <Badge variant="outline" className="font-mono">
                Current: #{currentBlock}
              </Badge>
              <span className="text-sm text-muted-foreground">Block #{endBlock}</span>
            </div>

            <Slider
              value={[currentBlock]}
              onValueChange={handleSliderChange}
              min={startBlock}
              max={endBlock}
              step={1}
              className="w-full"
            />

            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleStepBack} disabled={currentBlock <= startBlock}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button onClick={handlePlay} className="gap-2">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleStepForward} disabled={currentBlock >= endBlock}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="speed" className="text-sm">
                Speed:
              </Label>
              <select
                id="speed"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2 py-1 text-sm border rounded bg-background"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Jump to block number..."
              value={searchBlock}
              onChange={(e) => setSearchBlock(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleBlockSearch} variant="outline" className="gap-2 bg-transparent">
              <Search className="w-4 h-4" />
              Go
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Block Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Block Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {replayLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            ) : blockData ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Block Number:</span>
                  <span className="font-mono">#{blockData.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hash:</span>
                  <span className="font-mono text-xs">
                    {blockData.hash?.slice(0, 10)}...{blockData.hash?.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span>{new Date(blockData.timestamp * 1000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions:</span>
                  <span>{blockData.transactions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Used:</span>
                  <span className="font-mono">{blockData.gasUsed?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Limit:</span>
                  <span className="font-mono">{blockData.gasLimit?.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">No block data available</div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Block Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-1">{transactions.length}</div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-2">{events.length}</div>
                <div className="text-sm text-muted-foreground">Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-3">{stateChanges.length}</div>
                <div className="text-sm text-muted-foreground">State Changes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Replay Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{progress.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Blocks Processed:</span>
                  <span>{currentBlock - startBlock + 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span>{endBlock - currentBlock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Speed:</span>
                  <span>{playbackSpeed}x</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="state">State Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Block Transactions
              </CardTitle>
              <CardDescription>All transactions in block #{currentBlock}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {transactions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No transactions in this block
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </span>
                          <Badge variant={tx.status === 1 ? "default" : "destructive"}>
                            {tx.status === 1 ? "Success" : "Failed"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            From: {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                          </div>
                          <div>
                            To: {tx.to?.slice(0, 8)}...{tx.to?.slice(-6)}
                          </div>
                          <div>Gas: {tx.gasUsed?.toLocaleString()}</div>
                          <div>Value: {tx.value} ETH</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Contract Events
              </CardTitle>
              <CardDescription>Events emitted in block #{currentBlock}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {events.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No events in this block
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{event.eventName}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.contractAddress.slice(0, 8)}...{event.contractAddress.slice(-6)}
                          </span>
                        </div>
                        {event.args && Object.keys(event.args).length > 0 && (
                          <div className="bg-muted/50 rounded p-2 text-xs font-mono">
                            {Object.entries(event.args).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="break-all">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="state">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                State Changes
              </CardTitle>
              <CardDescription>Contract state modifications in block #{currentBlock}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {stateChanges.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No state changes tracked for this block
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stateChanges.map((change, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">
                            {change.address.slice(0, 10)}...{change.address.slice(-8)}
                          </span>
                          <Badge variant="secondary">{change.type}</Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Storage Slot:</span>
                            <span className="font-mono">{change.slot}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Before:</span>
                            <span className="font-mono">{change.before}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">After:</span>
                            <span className="font-mono">{change.after}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
