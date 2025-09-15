# Somnia DevLab SDK Examples

This document provides comprehensive examples for using the Somnia DevLab SDK in various scenarios.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Real-time Event Monitoring](#real-time-event-monitoring)
3. [Gas Profiling and Optimization](#gas-profiling-and-optimization)
4. [Stress Testing with Chaos Mode](#stress-testing-with-chaos-mode)
5. [Blockchain Replay and Analysis](#blockchain-replay-and-analysis)
6. [Advanced Use Cases](#advanced-use-cases)

## Basic Setup

### Simple Initialization

\`\`\`typescript
import { SomniaDevLab } from 'somnia-devlab-sdk'

const devlab = new SomniaDevLab({
  apiUrl: 'http://localhost:3001',
  wsUrl: 'ws://localhost:3001',
  network: 'testnet'
})

async function main() {
  try {
    await devlab.initialize()
    console.log('Somnia DevLab SDK initialized successfully')
    
    // Your code here
    
  } catch (error) {
    console.error('Failed to initialize:', error)
  } finally {
    await devlab.disconnect()
  }
}

main()
\`\`\`

### With Authentication

\`\`\`typescript
const devlab = new SomniaDevLab({
  apiUrl: 'https://api.somnia-devlab.com',
  wsUrl: 'wss://ws.somnia-devlab.com',
  apiKey: 'your-api-key-here',
  network: 'mainnet'
})
\`\`\`

## Real-time Event Monitoring

### Monitor DEX Activity

\`\`\`typescript
async function monitorDEX() {
  const DEX_ADDRESS = '0x1234567890123456789012345678901234567890'
  
  // Subscribe to DEX events
  devlab.stream.on('Swap', (event) => {
    console.log('🔄 Swap detected:')
    console.log(`  User: ${event.args.user}`)
    console.log(`  Token In: ${event.args.tokenIn}`)
    console.log(`  Token Out: ${event.args.tokenOut}`)
    console.log(`  Amount In: ${event.args.amountIn}`)
    console.log(`  Amount Out: ${event.args.amountOut}`)
    console.log(`  Block: ${event.blockNumber}`)
    console.log(`  TX: ${event.transactionHash}`)
  })
  
  devlab.stream.on('LiquidityAdded', (event) => {
    console.log('💧 Liquidity added:')
    console.log(`  Provider: ${event.args.provider}`)
    console.log(`  Token A: ${event.args.tokenA}`)
    console.log(`  Token B: ${event.args.tokenB}`)
    console.log(`  Amount A: ${event.args.amountA}`)
    console.log(`  Amount B: ${event.args.amountB}`)
  })
  
  // Start monitoring
  devlab.stream.subscribe(DEX_ADDRESS, ['Swap', 'LiquidityAdded'])
  
  console.log(`Monitoring DEX at ${DEX_ADDRESS}...`)
}
\`\`\`

### Track Network Performance

\`\`\`typescript
async function trackNetworkPerformance() {
  let highTpsCount = 0
  let totalTps = 0
  let measurements = 0
  
  devlab.stream.on('metrics', (metrics) => {
    totalTps += metrics.tps
    measurements++
    
    if (metrics.tps > 1000) {
      highTpsCount++
      console.log(`🚀 High TPS: ${metrics.tps.toFixed(2)}`)
    }
    
    if (metrics.errorRate > 5) {
      console.log(`⚠️  High error rate: ${metrics.errorRate.toFixed(1)}%`)
    }
    
    if (metrics.latency > 1000) {
      console.log(`🐌 High latency: ${metrics.latency}ms`)
    }
    
    // Log summary every 60 measurements (roughly 1 minute)
    if (measurements % 60 === 0) {
      const avgTps = totalTps / measurements
      console.log(`📊 Average TPS over ${measurements} measurements: ${avgTps.toFixed(2)}`)
      console.log(`📈 High TPS events: ${highTpsCount}`)
    }
  })
}
\`\`\`

### Multi-Contract Monitoring

\`\`\`typescript
async function monitorMultipleContracts() {
  const contracts = [
    { address: '0xToken1...', name: 'Token A' },
    { address: '0xToken2...', name: 'Token B' },
    { address: '0xDEX...', name: 'DEX Contract' }
  ]
  
  // Generic event handler
  devlab.stream.on('*', (event) => {
    const contract = contracts.find(c => c.address === event.contractAddress)
    const contractName = contract ? contract.name : 'Unknown'
    
    console.log(`📡 ${event.eventName} from ${contractName}`)
    console.log(`   Block: ${event.blockNumber}`)
    console.log(`   Args:`, event.args)
  })
  
  // Subscribe to all contracts
  contracts.forEach(contract => {
    devlab.stream.subscribe(contract.address)
    console.log(`Subscribed to ${contract.name}`)
  })
}
\`\`\`

## Gas Profiling and Optimization

### Comprehensive Gas Analysis

\`\`\`typescript
async function analyzeGasUsage() {
  const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
  
  console.log('Starting comprehensive gas analysis...')
  
  // Run profiling
  const profileData = await devlab.profiler.profile(CONTRACT_ADDRESS, {
    type: 'comprehensive',
    iterations: 500,
    includeHotspots: true,
    generateRecommendations: true
  })
  
  console.log('\n📊 Gas Usage Analysis Results:')
  console.log('=' .repeat(50))
  
  // Sort by average gas usage
  const sortedFunctions = profileData.sort((a, b) => b.avgGas - a.avgGas)
  
  sortedFunctions.forEach((func, index) => {
    console.log(`${index + 1}. ${func.functionName}`)
    console.log(`   Average Gas: ${func.avgGas.toLocaleString()}`)
    console.log(`   Max Gas: ${func.maxGas.toLocaleString()}`)
    console.log(`   Min Gas: ${func.minGas.toLocaleString()}`)
    console.log(`   Call Count: ${func.callCount}`)
    console.log(`   Avg Execution Time: ${func.avgExecutionTime.toFixed(2)}ms`)
    console.log(`   Total Gas Used: ${(func.avgGas * func.callCount).toLocaleString()}`)
    console.log('')
  })
  
  // Identify optimization opportunities
  const expensiveFunctions = sortedFunctions.filter(f => f.avgGas > 100000)
  const frequentFunctions = sortedFunctions.filter(f => f.callCount > 100)
  
  console.log('🔥 High Gas Functions (>100k gas):')
  expensiveFunctions.forEach(func => {
    console.log(`   ${func.functionName}: ${func.avgGas.toLocaleString()} gas`)
  })
  
  console.log('\n📈 Frequently Called Functions (>100 calls):')
  frequentFunctions.forEach(func => {
    console.log(`   ${func.functionName}: ${func.callCount} calls`)
  })
  
  // Get optimization recommendations
  const recommendations = await devlab.profiler.getRecommendations(CONTRACT_ADDRESS)
  
  console.log('\n💡 Optimization Recommendations:')
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.title}`)
    console.log(`   Impact: ${rec.impact}`)
    console.log(`   Savings: ${rec.estimatedSavings}`)
    console.log(`   Description: ${rec.description}`)
    console.log('')
  })
}
\`\`\`

### Continuous Gas Monitoring

\`\`\`typescript
async function continuousGasMonitoring() {
  const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
  
  setInterval(async () => {
    try {
      const profileData = await devlab.profiler.getProfileData(CONTRACT_ADDRESS)
      
      if (profileData.length > 0) {
        const totalGasUsed = profileData.reduce((sum, func) => 
          sum + (func.avgGas * func.callCount), 0
        )
        
        const mostExpensive = profileData.reduce((max, func) => 
          func.avgGas > max.avgGas ? func : max
        )
        
        console.log(`⛽ Total gas used: ${totalGasUsed.toLocaleString()}`)
        console.log(`🔥 Most expensive function: ${mostExpensive.functionName} (${mostExpensive.avgGas.toLocaleString()} gas)`)
        
        // Alert if gas usage is too high
        if (mostExpensive.avgGas > 500000) {
          console.log('🚨 ALERT: Function using excessive gas!')
        }
      }
    } catch (error) {
      console.error('Error in gas monitoring:', error)
    }
  }, 30000) // Check every 30 seconds
}
\`\`\`

## Stress Testing with Chaos Mode

### Basic Stress Test

\`\`\`typescript
async function basicStressTest() {
  const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
  
  console.log('🧪 Starting basic stress test...')
  
  const testId = await devlab.chaos.startTest(CONTRACT_ADDRESS, {
    testType: 'spam',
    transactionCount: 1000,
    concurrency: 20,
    gasLimit: 100000,
    value: '0.001',
    duration: 300 // 5 minutes
  })
  
  console.log(`Test started with ID: ${testId}`)
  
  // Monitor progress
  devlab.chaos.onTestUpdate(testId, (update) => {
    console.log(`Progress: ${update.progress.toFixed(1)}%`)
    console.log(`Completed: ${update.completed}/${update
