const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const { Pool } = require("pg")
const Redis = require("redis")
const { ethers } = require("ethers")
const winston = require("winston")
require("dotenv").config()

const EventListener = require("./services/EventListener")
const MetricsCollector = require("./services/MetricsCollector")
const StressTestRunner = require("./services/StressTestRunner")

// Initialize logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
})

// Initialize Express app
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://devlab:devlab123@localhost:5432/somnia_devlab",
})

// Redis connection
const redis = Redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

// Ethereum provider
const provider = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC_URL || "https://testnet-rpc.somnia.network")

// Initialize services
let eventListener, metricsCollector, stressTestRunner

async function initializeServices() {
  try {
    await redis.connect()
    logger.info("Connected to Redis")

    eventListener = new EventListener(provider, db, redis, io, logger)
    metricsCollector = new MetricsCollector(db, redis, io, logger)
    stressTestRunner = new StressTestRunner(provider, db, logger)

    await eventListener.start()
    await metricsCollector.start()

    logger.info("All services initialized successfully")
  } catch (error) {
    logger.error("Failed to initialize services:", error)
    process.exit(1)
  }
}

// API Routes

// Get real-time metrics
app.get("/api/metrics/realtime", async (req, res) => {
  try {
    const metrics = await metricsCollector.getCurrentMetrics()
    res.json(metrics)
  } catch (error) {
    logger.error("Error fetching realtime metrics:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get historical metrics
app.get("/api/metrics/history", async (req, res) => {
  try {
    const { timeRange = "1h", metricType } = req.query
    const result = await db.query(
      `
      SELECT metric_type, value, timestamp
      FROM realtime_metrics
      WHERE timestamp > NOW() - INTERVAL $1
      ${metricType ? "AND metric_type = $2" : ""}
      ORDER BY timestamp ASC
    `,
      metricType ? [timeRange, metricType] : [timeRange],
    )

    res.json(result.rows)
  } catch (error) {
    logger.error("Error fetching historical metrics:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get contract events
app.get("/api/events", async (req, res) => {
  try {
    const { contractAddress, eventName, blockNumber, limit = 100 } = req.query
    let query = "SELECT * FROM contract_events WHERE 1=1"
    const params = []

    if (contractAddress) {
      params.push(contractAddress)
      query += ` AND contract_address = $${params.length}`
    }

    if (eventName) {
      params.push(eventName)
      query += ` AND event_name = $${params.length}`
    }

    if (blockNumber) {
      params.push(blockNumber)
      query += ` AND block_number = $${params.length}`
    }

    params.push(limit)
    query += ` ORDER BY timestamp DESC LIMIT $${params.length}`

    const result = await db.query(query, params)
    res.json(result.rows)
  } catch (error) {
    logger.error("Error fetching events:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get transaction logs for replay
app.get("/api/transactions", async (req, res) => {
  try {
    const { blockNumber, limit = 100 } = req.query
    let query = "SELECT * FROM transaction_logs WHERE 1=1"
    const params = []

    if (blockNumber) {
      params.push(blockNumber)
      query += ` AND block_number = $${params.length}`
    }

    params.push(limit)
    query += ` ORDER BY timestamp DESC LIMIT $${params.length}`

    const result = await db.query(query, params)
    res.json(result.rows)
  } catch (error) {
    logger.error("Error fetching transactions:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get gas profiling data
app.get("/api/profiling", async (req, res) => {
  try {
    const { contractAddress } = req.query
    let query = `
      SELECT 
        function_name,
        AVG(gas_used) as avg_gas,
        MAX(gas_used) as max_gas,
        MIN(gas_used) as min_gas,
        COUNT(*) as call_count,
        AVG(execution_time_ms) as avg_execution_time
      FROM gas_profiles
      WHERE 1=1
    `
    const params = []

    if (contractAddress) {
      params.push(contractAddress)
      query += ` AND contract_address = $${params.length}`
    }

    query += " GROUP BY function_name ORDER BY avg_gas DESC"

    const result = await db.query(query, params)
    res.json(result.rows)
  } catch (error) {
    logger.error("Error fetching profiling data:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Start stress test
app.post("/api/stress-test/start", async (req, res) => {
  try {
    const { contractAddress, testConfig } = req.body
    const testId = await stressTestRunner.startTest(contractAddress, testConfig)
    res.json({ testId, status: "started" })
  } catch (error) {
    logger.error("Error starting stress test:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get stress test results
app.get("/api/stress-test/results", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM stress_test_results
      ORDER BY started_at DESC
      LIMIT 10
    `)
    res.json(result.rows)
  } catch (error) {
    logger.error("Error fetching stress test results:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get latest block number
app.get("/api/blocks/latest", async (req, res) => {
  try {
    const latestBlock = await provider.getBlockNumber()
    res.json({ blockNumber: latestBlock })
  } catch (error) {
    logger.error("Error fetching latest block:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get block range information
app.get("/api/blocks/range", async (req, res) => {
  try {
    const { start, end } = req.query
    const startBlock = Number.parseInt(start) || 0
    const endBlock = Number.parseInt(end) || 100

    const blocks = []
    for (let i = startBlock; i <= Math.min(endBlock, startBlock + 100); i++) {
      try {
        const block = await provider.getBlock(i)
        if (block) {
          blocks.push({
            number: block.number,
            hash: block.hash,
            timestamp: block.timestamp,
            transactionCount: block.transactions.length,
          })
        }
      } catch (blockError) {
        logger.warn(`Error fetching block ${i}:`, blockError)
      }
    }

    res.json(blocks)
  } catch (error) {
    logger.error("Error fetching block range:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get specific block data
app.get("/api/blocks/:blockNumber", async (req, res) => {
  try {
    const blockNumber = Number.parseInt(req.params.blockNumber)
    const block = await provider.getBlock(blockNumber, true)

    if (!block) {
      return res.status(404).json({ error: "Block not found" })
    }

    res.json({
      number: block.number,
      hash: block.hash,
      timestamp: block.timestamp,
      transactions: block.transactions.map((tx) => tx.hash),
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      parentHash: block.parentHash,
    })
  } catch (error) {
    logger.error("Error fetching block:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get state changes (mock endpoint for demonstration)
app.get("/api/state-changes", async (req, res) => {
  try {
    const { blockNumber } = req.query

    // In a real implementation, this would fetch actual state changes
    // For now, return mock data
    const mockStateChanges = [
      {
        address: "0x1234567890123456789012345678901234567890",
        slot: "0x0",
        before: "0x0000000000000000000000000000000000000000000000000000000000000000",
        after: "0x0000000000000000000000000000000000000000000000000000000000000001",
        type: "SSTORE",
      },
      {
        address: "0x9876543210987654321098765432109876543210",
        slot: "0x1",
        before: "0x0000000000000000000000000000000000000000000000000000000000000001",
        after: "0x0000000000000000000000000000000000000000000000000000000000000002",
        type: "SSTORE",
      },
    ]

    res.json(mockStateChanges)
  } catch (error) {
    logger.error("Error fetching state changes:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// WebSocket connection handling
io.on("connection", (socket) => {
  logger.info("Client connected:", socket.id)

  socket.on("subscribe", (data) => {
    const { contractAddress, eventTypes } = data
    socket.join(`contract:${contractAddress}`)
    if (eventTypes) {
      eventTypes.forEach((eventType) => {
        socket.join(`event:${eventType}`)
      })
    }
    logger.info(`Client ${socket.id} subscribed to contract ${contractAddress}`)
  })

  socket.on("unsubscribe", (data) => {
    const { contractAddress } = data
    socket.leave(`contract:${contractAddress}`)
    logger.info(`Client ${socket.id} unsubscribed from contract ${contractAddress}`)
  })

  socket.on("disconnect", () => {
    logger.info("Client disconnected:", socket.id)
  })
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      redis: redis.isReady ? "connected" : "disconnected",
      ethereum: "connected",
    },
  })
})

// Start server
const PORT = process.env.PORT || 3001

async function startServer() {
  await initializeServices()

  server.listen(PORT, () => {
    logger.info(`Somnia DevLab Backend running on port ${PORT}`)
  })
}

startServer().catch((error) => {
  logger.error("Failed to start server:", error)
  process.exit(1)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully")
  await redis.quit()
  await db.end()
  server.close(() => {
    logger.info("Server closed")
    process.exit(0)
  })
})
