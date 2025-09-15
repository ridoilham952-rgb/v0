# Somnia DevLab SDK

The official JavaScript/TypeScript SDK for Somnia DevLab - a comprehensive blockchain development toolkit for the Somnia Network.

## Features

- **Real-time Event Streaming** - Subscribe to contract events with WebSocket connections
- **Gas Profiling** - Analyze and optimize smart contract gas consumption
- **Chaos Mode** - Stress test contracts with attack simulations
- **Replay Timeline** - Inspect blockchain state at any point in time
- **Comprehensive Monitoring** - Track TPS, latency, error rates, and more

## Installation

\`\`\`bash
npm install somnia-devlab-sdk
\`\`\`

## Quick Start

\`\`\`typescript
import { SomniaDevLab } from 'somnia-devlab-sdk'

// Initialize the SDK
const devlab = new SomniaDevLab({
  apiUrl: 'http://localhost:3001',
  wsUrl: 'ws://localhost:3001',
  network: 'testnet'
})

// Connect to services
await devlab.initialize()

// Subscribe to contract events
devlab.stream.on('Transfer', (event) => {
  console.log('Transfer event:', event)
})

devlab.stream.subscribe('0x1234...', ['Transfer', 'Approval'])
\`\`\`

## API Reference

### SomniaDevLab

Main SDK class providing access to all development tools.

#### Constructor

\`\`\`typescript
new SomniaDevLab(config: DevLabConfig)
\`\`\`

**Parameters:**
- `config.apiUrl` - Backend API URL
- `config.wsUrl` - WebSocket server URL  
- `config.apiKey` - Optional API key for authentication
- `config.network` - Network type ('mainnet' | 'testnet')

#### Methods

##### `initialize(): Promise<void>`
Initialize all SDK components and establish connections.

##### `getMetrics(): Promise<MetricsData>`
Get current network performance metrics.

##### `getEvents(contractAddress: string, options?): Promise<ContractEvent[]>`
Fetch contract events with optional filtering.

##### `disconnect(): Promise<void>`
Disconnect from all services and cleanup resources.

### SomniaStream

Real-time event streaming for blockchain monitoring.

#### Methods

##### `connect(): Promise<void>`
Establish WebSocket connection to the event stream.

##### `on(eventName: string, callback: EventCallback): void`
Subscribe to specific event types.

\`\`\`typescript
// Listen for specific events
devlab.stream.on('Transfer', (event) => {
  console.log('Transfer:', event.args)
})

// Listen for all events
devlab.stream.on('*', (event) => {
  console.log('Any event:', event)
})

// Listen for metrics updates
devlab.stream.on('metrics', (metrics) => {
  console.log('TPS:', metrics.tps)
})
\`\`\`

##### `subscribe(contractAddress: string, eventTypes?: string[]): void`
Subscribe to events from a specific contract.

##### `unsubscribe(contractAddress: string): void`
Unsubscribe from contract events.

### GasProfiler

Analyze and optimize smart contract gas consumption.

#### Methods

##### `profile(contractAddress: string, options?): Promise<GasProfileData[]>`
Start comprehensive gas profiling for a contract.

\`\`\`typescript
const profileData = await devlab.profiler.profile('0x1234...', {
  type: 'comprehensive',
  iterations: 100,
  includeHotspots: true,
  generateRecommendations: true
})

console.log('Gas usage by function:', profileData)
\`\`\`

##### `getProfileData(contractAddress: string): Promise<GasProfileData[]>`
Get existing profiling data for a contract.

##### `getRecommendations(contractAddress: string): Promise<any[]>`
Get AI-generated optimization recommendations.

### ChaosMode

Stress testing and attack simulation for contract resilience.

#### Methods

##### `startTest(contractAddress: string, config: StressTestConfig): Promise<string>`
Start a chaos mode stress test.

\`\`\`typescript
const testId = await devlab.chaos.startTest('0x1234...', {
  testType: 'spam',
  transactionCount: 1000,
  concurrency: 50,
  gasLimit: 100000,
  duration: 300
})

console.log('Test started:', testId)
\`\`\`

##### `getResults(): Promise<StressTestResult[]>`
Get historical stress test results.

##### `onTestUpdate(testId: string, callback: Function): void`
Monitor active test progress in real-time.

### ReplayViewer

Inspect blockchain state and transactions at any point in time.

#### Methods

##### `getBlock(blockNumber: number): Promise<BlockData>`
Get detailed information about a specific block.

##### `getBlockRange(start: number, end: number): Promise<BlockData[]>`
Fetch multiple blocks in a range.

##### `getLatestBlock(): Promise<number>`
Get the latest block number.

##### `getBlockTransactions(blockNumber: number): Promise<any[]>`
Get all transactions in a specific block.

##### `getBlockEvents(blockNumber: number): Promise<any[]>`
Get all events emitted in a specific block.

## Examples

### Real-time Monitoring

\`\`\`typescript
import { SomniaDevLab } from 'somnia-devlab-sdk'

const devlab = new SomniaDevLab({
  apiUrl: 'http://localhost:3001',
  wsUrl: 'ws://localhost:3001'
})

await devlab.initialize()

// Monitor DEX swaps
devlab.stream.on('Swap', (event) => {
  console.log(`Swap: ${event.args.amountIn} → ${event.args.amountOut}`)
})

// Track network performance
devlab.stream.on('metrics', (metrics) => {
  if (metrics.tps > 1000) {
    console.log('High TPS detected:', metrics.tps)
  }
})

devlab.stream.subscribe('0xDEX_CONTRACT_ADDRESS', ['Swap', 'LiquidityAdded'])
\`\`\`

### Gas Optimization

\`\`\`typescript
// Profile a contract's gas usage
const profileData = await devlab.profiler.profile('0xCONTRAT_ADDRESS', {
  type: 'comprehensive',
  iterations: 200
})

// Find the most expensive functions
const hotspots = profileData
  .sort((a, b) => b.avgGas - a.avgGas)
  .slice(0, 5)

console.log('Top 5 gas consumers:')
hotspots.forEach(func => {
  console.log(`${func.functionName}: ${func.avgGas.toLocaleString()} gas`)
})

// Get optimization recommendations
const recommendations = await devlab.profiler.getRecommendations('0xCONTRAT_ADDRESS')
recommendations.forEach(rec => {
  console.log(`${rec.title}: ${rec.estimatedSavings}`)
})
\`\`\`

### Stress Testing

\`\`\`typescript
// Run a comprehensive stress test
const testId = await devlab.chaos.startTest('0xCONTRAT_ADDRESS', {
  testType: 'mixed',
  transactionCount: 5000,
  concurrency: 100,
  gasLimit: 200000,
  duration: 600 // 10 minutes
})

// Monitor test progress
devlab.chaos.onTestUpdate(testId, (update) => {
  console.log(`Progress: ${update.progress}% - TPS: ${update.tps}`)
})

// Get results after completion
setTimeout(async () => {
  const results = await devlab.chaos.getResults()
  const latestTest = results[0]
  
  console.log('Test Results:')
  console.log(`Success Rate: ${(latestTest.successfulTransactions / latestTest.totalTransactions * 100).toFixed(1)}%`)
  console.log(`Average TPS: ${latestTest.averageTps}`)
  console.log(`Average Latency: ${latestTest.averageLatency}ms`)
}, 610000)
\`\`\`

### Blockchain Replay

\`\`\`typescript
// Inspect a specific block
const block = await devlab.replay.getBlock(12345)
console.log(`Block ${block.number}: ${block.transactions.length} transactions`)

// Get all events in that block
const events = await devlab.replay.getBlockEvents(12345)
console.log('Events in block:', events.length)

// Replay a range of blocks
const blocks = await devlab.replay.getBlockRange(12340, 12350)
blocks.forEach(block => {
  console.log(`Block ${block.number}: ${block.gasUsed} gas used`)
})
\`\`\`

## Error Handling

The SDK throws descriptive errors for various failure scenarios:

\`\`\`typescript
try {
  await devlab.initialize()
} catch (error) {
  if (error.message.includes('Connection timeout')) {
    console.error('Failed to connect to Somnia DevLab backend')
  } else if (error.message.includes('Authentication')) {
    console.error('Invalid API key')
  } else {
    console.error('Initialization failed:', error.message)
  }
}
\`\`\`

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

\`\`\`typescript
import { 
  SomniaDevLab, 
  ContractEvent, 
  MetricsData, 
  StressTestConfig 
} from 'somnia-devlab-sdk'

const handleEvent = (event: ContractEvent) => {
  // Full type safety
  console.log(event.contractAddress, event.eventName, event.args)
}

const testConfig: StressTestConfig = {
  testType: 'spam', // Type-checked
  transactionCount: 1000,
  concurrency: 10,
  gasLimit: 100000
}
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: https://docs.somnia-devlab.com
- Issues: https://github.com/somnia-network/devlab-sdk/issues
- Discord: https://discord.gg/somnia-devlab
