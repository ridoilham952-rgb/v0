"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Bomb, Play, Square, AlertTriangle, TrendingUp, Activity, Target } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useChaosMode } from "@/hooks/use-chaos-mode"

interface ChaosModeProps {
  contractAddress: string | null
}

export default function ChaosMode({ contractAddress }: ChaosModeProps) {
  const [testConfig, setTestConfig] = useState({
    testType: "spam",
    transactionCount: 100,
    concurrency: 10,
    gasLimit: 100000,
    value: "0.001",
    duration: 60,
    enableReentrancy: false,
    enableRevertLoop: false,
    enableGasBomb: false,
  })

  const { isRunning, currentTest, testResults, liveMetrics, startTest, stopTest, getTestHistory } = useChaosMode()

  const handleStartTest = async () => {
    if (!contractAddress) return

    await startTest(contractAddress, testConfig)
  }

  const handleStopTest = () => {
    stopTest()
  }

  const updateConfig = (key: string, value: any) => {
    setTestConfig((prev) => ({ ...prev, [key]: value }))
  }

  const getTestTypeDescription = (type: string) => {
    switch (type) {
      case "spam":
        return "Flood the contract with high-volume transactions"
      case "reentrancy":
        return "Attempt reentrancy attacks on vulnerable functions"
      case "revert_loop":
        return "Test resilience with intentionally failing transactions"
      case "gas_bomb":
        return "Deploy gas-intensive operations to test limits"
      case "mixed":
        return "Combined attack patterns for comprehensive testing"
      default:
        return "Custom stress test configuration"
    }
  }

  if (!contractAddress) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Bomb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a contract to start chaos mode testing</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chaos Mode Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bomb className="w-5 h-5" />
            Chaos Mode - Stress Testing & Attack Simulation
          </CardTitle>
          <CardDescription>
            Test contract resilience with high-volume transactions and attack simulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="test-type">Test Type</Label>
              <Select
                value={testConfig.testType}
                onValueChange={(value) => updateConfig("testType", value)}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Transaction Spam</SelectItem>
                  <SelectItem value="reentrancy">Reentrancy Attack</SelectItem>
                  <SelectItem value="revert_loop">Revert Loop</SelectItem>
                  <SelectItem value="gas_bomb">Gas Bomb</SelectItem>
                  <SelectItem value="mixed">Mixed Attacks</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{getTestTypeDescription(testConfig.testType)}</p>
            </div>

            <div>
              <Label htmlFor="tx-count">Transaction Count</Label>
              <Input
                id="tx-count"
                type="number"
                value={testConfig.transactionCount}
                onChange={(e) => updateConfig("transactionCount", Number.parseInt(e.target.value) || 100)}
                disabled={isRunning}
                min="10"
                max="10000"
              />
            </div>

            <div>
              <Label htmlFor="concurrency">Concurrency</Label>
              <Input
                id="concurrency"
                type="number"
                value={testConfig.concurrency}
                onChange={(e) => updateConfig("concurrency", Number.parseInt(e.target.value) || 10)}
                disabled={isRunning}
                min="1"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="gas-limit">Gas Limit</Label>
              <Input
                id="gas-limit"
                type="number"
                value={testConfig.gasLimit}
                onChange={(e) => updateConfig("gasLimit", Number.parseInt(e.target.value) || 100000)}
                disabled={isRunning}
              />
            </div>

            <div>
              <Label htmlFor="value">Value (ETH)</Label>
              <Input
                id="value"
                value={testConfig.value}
                onChange={(e) => updateConfig("value", e.target.value)}
                disabled={isRunning}
                placeholder="0.001"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={testConfig.duration}
                onChange={(e) => updateConfig("duration", Number.parseInt(e.target.value) || 60)}
                disabled={isRunning}
                min="10"
                max="3600"
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Advanced Attack Patterns</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reentrancy">Enable Reentrancy</Label>
                  <p className="text-xs text-muted-foreground">Test for reentrancy vulnerabilities</p>
                </div>
                <Switch
                  id="reentrancy"
                  checked={testConfig.enableReentrancy}
                  onCheckedChange={(checked) => updateConfig("enableReentrancy", checked)}
                  disabled={isRunning}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="revert-loop">Enable Revert Loop</Label>
                  <p className="text-xs text-muted-foreground">Test with failing transactions</p>
                </div>
                <Switch
                  id="revert-loop"
                  checked={testConfig.enableRevertLoop}
                  onCheckedChange={(checked) => updateConfig("enableRevertLoop", checked)}
                  disabled={isRunning}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gas-bomb">Enable Gas Bomb</Label>
                  <p className="text-xs text-muted-foreground">Deploy gas-intensive operations</p>
                </div>
                <Switch
                  id="gas-bomb"
                  checked={testConfig.enableGasBomb}
                  onCheckedChange={(checked) => updateConfig("enableGasBomb", checked)}
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4">
            <Button onClick={handleStartTest} disabled={isRunning} className="gap-2" variant="destructive">
              <Play className="w-4 h-4" />
              Start Chaos Test
            </Button>
            <Button onClick={handleStopTest} disabled={!isRunning} variant="outline" className="gap-2 bg-transparent">
              <Square className="w-4 h-4" />
              Stop Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Test Status */}
      {isRunning && currentTest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Test Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-1">{currentTest.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentTest.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{currentTest.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-2">{currentTest.tps?.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Current TPS</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{currentTest.progress}%</span>
              </div>
              <Progress value={currentTest.progress} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Elapsed Time:</span>
                <span className="ml-2 font-mono">{currentTest.elapsedTime}s</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Latency:</span>
                <span className="ml-2 font-mono">{currentTest.avgLatency}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Error Rate:</span>
                <span className="ml-2 font-mono">{currentTest.errorRate?.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gas Usage:</span>
                <span className="ml-2 font-mono">{currentTest.avgGas?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Real-time Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveMetrics.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No live metrics available
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="timestamp" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="tps" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                      <Line type="monotone" dataKey="errorRate" stroke="hsl(var(--destructive))" strokeWidth={2} />
                      <Line type="monotone" dataKey="latency" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Test Results History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {testResults.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No test results available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{result.test_name}</h4>
                          <Badge variant="outline">{new Date(result.completed_at).toLocaleString()}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total TX:</span>
                            <div className="font-medium">{result.total_transactions}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Success Rate:</span>
                            <div className="font-medium text-green-600">
                              {((result.successful_transactions / result.total_transactions) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg TPS:</span>
                            <div className="font-medium">{result.average_tps.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Latency:</span>
                            <div className="font-medium">{result.average_latency_ms}ms</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(result.successful_transactions / result.total_transactions) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Resilience Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {testResults.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Run chaos tests to see resilience analysis
                  </div>
                ) : (
                  <>
                    {/* Overall Resilience Score */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-chart-1 mb-2">
                        {testResults.length > 0
                          ? Math.round(
                              (testResults.reduce(
                                (acc, r) => acc + r.successful_transactions / r.total_transactions,
                                0,
                              ) /
                                testResults.length) *
                                100,
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-muted-foreground">Overall Resilience Score</div>
                    </div>

                    {/* Key Findings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Strengths</h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• High transaction throughput capability</li>
                          <li>• Consistent performance under load</li>
                          <li>• Low error rates during normal operations</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Vulnerabilities</h4>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          <li>• Performance degrades under extreme load</li>
                          <li>• Potential gas optimization opportunities</li>
                          <li>• Error handling could be improved</li>
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Recommendations</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Implement circuit breakers for high-load scenarios</li>
                        <li>• Add rate limiting to prevent spam attacks</li>
                        <li>• Optimize gas usage in frequently called functions</li>
                        <li>• Enhance error handling and recovery mechanisms</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
