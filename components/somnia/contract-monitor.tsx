"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, TrendingUp, AlertCircle, Database } from "lucide-react"
import { useContractData } from "@/hooks/use-contract-data"

interface ContractMonitorProps {
  contractAddress: string | null
}

export default function ContractMonitor({ contractAddress }: ContractMonitorProps) {
  const { events, transactions, gasProfile, isLoading } = useContractData(contractAddress)

  if (!contractAddress) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a contract to start monitoring</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contract Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Contract Monitor
          </CardTitle>
          <CardDescription className="font-mono text-sm">{contractAddress}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-1">{isLoading ? "..." : events.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">{isLoading ? "..." : transactions.length}</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-3">{isLoading ? "..." : gasProfile.length}</div>
              <div className="text-sm text-muted-foreground">Function Calls</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="gas">Gas Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {events.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No events found</div>
                ) : (
                  <div className="space-y-3">
                    {events.slice(0, 10).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Badge variant="outline">{event.event_name}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">Block #{event.block_number}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {transactions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((tx, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-mono text-sm">
                            {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Gas: {Number(tx.gas_used).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={tx.status === 1 ? "default" : "destructive"}>
                            {tx.status === 1 ? "Success" : "Failed"}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">Block #{tx.block_number}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Gas Usage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {gasProfile.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No gas profile data available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gasProfile.map((profile, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{profile.function_name}</div>
                          <div className="text-sm text-muted-foreground">{profile.call_count} calls</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">{Math.round(profile.avg_gas).toLocaleString()} gas</div>
                          <div className="text-xs text-muted-foreground">
                            avg {profile.avg_execution_time?.toFixed(0)}ms
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
