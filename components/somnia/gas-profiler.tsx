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
import { BarChart3, TrendingUp, AlertCircle, Zap, Play, Download, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useGasProfile } from "@/hooks/use-gas-profile"

interface GasProfilerProps {
  contractAddress: string | null
}

export default function GasProfiler({ contractAddress }: GasProfilerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [testContract, setTestContract] = useState("")
  const [profileType, setProfileType] = useState("comprehensive")
  const [iterations, setIterations] = useState(100)

  const { profileData, hotspots, recommendations, isLoading, startProfiling, exportReport } =
    useGasProfile(contractAddress)

  const handleStartProfiling = async () => {
    if (!testContract) return

    setIsRunning(true)
    try {
      await startProfiling(testContract, {
        type: profileType,
        iterations,
        includeHotspots: true,
        generateRecommendations: true,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleExportReport = () => {
    exportReport()
  }

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  if (!contractAddress && !testContract) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Enter a contract address to start gas profiling</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profiler Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Gas Profiler & Bottleneck Analyzer
          </CardTitle>
          <CardDescription>Analyze gas consumption and identify performance bottlenecks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="test-contract">Contract Address</Label>
              <Input
                id="test-contract"
                placeholder="0x... or use monitored contract"
                value={testContract || contractAddress || ""}
                onChange={(e) => setTestContract(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <div>
              <Label htmlFor="profile-type">Profile Type</Label>
              <Select value={profileType} onValueChange={setProfileType} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  <SelectItem value="functions">Functions Only</SelectItem>
                  <SelectItem value="hotspots">Hotspots Only</SelectItem>
                  <SelectItem value="optimization">Optimization Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="iterations">Test Iterations</Label>
              <Input
                id="iterations"
                type="number"
                value={iterations}
                onChange={(e) => setIterations(Number.parseInt(e.target.value) || 100)}
                disabled={isRunning}
                min="10"
                max="1000"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleStartProfiling} disabled={!testContract || isRunning} className="w-full gap-2">
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Profiling...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Profiling
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Results */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="functions">Functions</TabsTrigger>
            <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
            <TabsTrigger value="recommendations">Tips</TabsTrigger>
          </TabsList>
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="gap-2 bg-transparent"
            disabled={!profileData.length}
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gas Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Gas Usage by Function
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No profiling data available
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profileData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="function_name" angle={-45} textAnchor="end" height={80} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [value.toLocaleString(), "Average Gas"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="avg_gas" fill="hsl(var(--chart-1))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gas Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Gas Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No profiling data available
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profileData.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ function_name, percent }) => `${function_name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="avg_gas"
                        >
                          {profileData.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Average Gas"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Function Gas Analysis
              </CardTitle>
              <CardDescription>Detailed gas consumption breakdown by function</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {profileData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No function data available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profileData.map((func, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{func.function_name}</h4>
                          <Badge variant="outline">{func.call_count} calls</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Avg Gas:</span>
                            <div className="font-mono font-medium">{Math.round(func.avg_gas).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Gas:</span>
                            <div className="font-mono font-medium">{Math.round(func.max_gas).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Gas:</span>
                            <div className="font-mono font-medium">{Math.round(func.min_gas).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Time:</span>
                            <div className="font-mono font-medium">{func.avg_execution_time?.toFixed(1)}ms</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-chart-1 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (func.avg_gas / Math.max(...profileData.map((p) => p.avg_gas))) * 100)}%`,
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

        <TabsContent value="hotspots">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Performance Hotspots
              </CardTitle>
              <CardDescription>Functions consuming the most gas and causing bottlenecks</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {hotspots.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hotspots identified
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hotspots.map((hotspot, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{hotspot.function_name}</h4>
                          <Badge variant="destructive">{hotspot.severity} Priority</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{hotspot.description}</div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Gas Impact:</span>
                            <div className="font-medium text-destructive">
                              {hotspot.gas_impact.toLocaleString()} gas
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Frequency:</span>
                            <div className="font-medium">{hotspot.frequency}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Optimization Potential:</span>
                            <div className="font-medium text-green-600">{hotspot.optimization_potential}%</div>
                          </div>
                        </div>
                        {hotspot.suggestions && (
                          <div className="bg-muted/50 rounded p-3 text-sm">
                            <div className="font-medium mb-1">Optimization Suggestions:</div>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {hotspot.suggestions.map((suggestion: string, i: number) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                            </ul>
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

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>AI-generated suggestions to improve gas efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {recommendations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No recommendations available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge
                            variant={
                              rec.impact === "high" ? "destructive" : rec.impact === "medium" ? "default" : "secondary"
                            }
                          >
                            {rec.impact} Impact
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{rec.description}</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Estimated Savings:</span>
                            <div className="font-medium text-green-600">{rec.estimated_savings}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Difficulty:</span>
                            <div className="font-medium">{rec.difficulty}</div>
                          </div>
                        </div>
                        {rec.code_example && (
                          <div className="bg-muted/50 rounded p-3 text-sm">
                            <div className="font-medium mb-2">Code Example:</div>
                            <pre className="text-xs overflow-x-auto">
                              <code>{rec.code_example}</code>
                            </pre>
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
      </Tabs>
    </div>
  )
}
