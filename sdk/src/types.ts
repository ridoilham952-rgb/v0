export interface DevLabConfig {
  apiUrl: string
  wsUrl: string
  apiKey?: string
  network?: "mainnet" | "testnet"
}

export interface ContractEvent {
  contractAddress: string
  eventName: string
  args: any
  blockNumber: number
  transactionHash: string
  timestamp: Date
}

export interface MetricsData {
  tps: number
  errorRate: number
  latency: number
  avgGas: number
  timestamp: Date
}

export interface GasProfileData {
  functionName: string
  avgGas: number
  maxGas: number
  minGas: number
  callCount: number
  avgExecutionTime: number
}

export interface StressTestConfig {
  testType: "spam" | "reentrancy" | "revert_loop" | "gas_bomb" | "mixed"
  transactionCount: number
  concurrency: number
  gasLimit: number
  value?: string
  duration?: number
}

export interface StressTestResult {
  testId: string
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  averageTps: number
  averageLatency: number
  duration: number
  startedAt: Date
  completedAt: Date
}

export interface BlockData {
  number: number
  hash: string
  timestamp: number
  transactions: string[]
  gasUsed: number
  gasLimit: number
}

export type EventCallback = (event: ContractEvent) => void

export type MetricsCallback = (metrics: MetricsData) => void
