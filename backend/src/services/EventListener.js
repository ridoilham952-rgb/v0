const { ethers } = require("ethers")

class EventListener {
  constructor(provider, db, redis, io, logger) {
    this.provider = provider
    this.db = db
    this.redis = redis
    this.io = io
    this.logger = logger
    this.isRunning = false
    this.contracts = new Map()
  }

  async start() {
    if (this.isRunning) return

    this.isRunning = true
    this.logger.info("Starting event listener...")

    // Listen for new blocks
    this.provider.on("block", async (blockNumber) => {
      await this.processBlock(blockNumber)
    })

    // Load and monitor known contracts
    await this.loadKnownContracts()
  }

  async loadKnownContracts() {
    // Sample contract ABIs for monitoring
    const sampleERC20ABI = [
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "event TokensMinted(address indexed to, uint256 amount)",
      "event TokensBurned(address indexed from, uint256 amount)",
    ]

    const miniDEXABI = [
      "event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 timestamp)",
      "event LiquidityAdded(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 timestamp)",
    ]

    // Add contracts to monitor (these would be loaded from database in production)
    this.addContract("SampleERC20", process.env.SAMPLE_ERC20_ADDRESS, sampleERC20ABI)
    this.addContract("MiniDEX", process.env.MINI_DEX_ADDRESS, miniDEXABI)
  }

  addContract(name, address, abi) {
    if (!address) return

    try {
      const contract = new ethers.Contract(address, abi, this.provider)
      this.contracts.set(address.toLowerCase(), { name, contract, abi })

      // Set up event listeners
      abi.forEach((item) => {
        if (item.startsWith("event ")) {
          const eventName = item.split("(")[0].replace("event ", "")
          contract.on(eventName, (...args) => {
            this.handleEvent(address, eventName, args)
          })
        }
      })

      this.logger.info(`Added contract ${name} at ${address} for monitoring`)
    } catch (error) {
      this.logger.error(`Failed to add contract ${name}:`, error)
    }
  }

  async processBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber, true)
      if (!block) return

      // Process each transaction in the block
      for (const tx of block.transactions) {
        await this.processTransaction(tx, block)
      }

      // Update real-time metrics
      await this.updateBlockMetrics(block)
    } catch (error) {
      this.logger.error(`Error processing block ${blockNumber}:`, error)
    }
  }

  async processTransaction(tx, block) {
    try {
      const receipt = await this.provider.getTransactionReceipt(tx.hash)
      if (!receipt) return

      // Store transaction log
      await this.storeTransactionLog(tx, receipt, block)

      // Process contract events in logs
      for (const log of receipt.logs) {
        await this.processLog(log, receipt)
      }

      // Update TPS metrics
      await this.updateTPSMetrics()
    } catch (error) {
      this.logger.error(`Error processing transaction ${tx.hash}:`, error)
    }
  }

  async storeTransactionLog(tx, receipt, block) {
    try {
      await this.db.query(
        `
        INSERT INTO transaction_logs (
          transaction_hash, block_number, block_hash, from_address, to_address,
          value, gas_used, gas_price, status, contract_address, logs, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (transaction_hash) DO NOTHING
      `,
        [
          tx.hash,
          block.number,
          block.hash,
          tx.from,
          tx.to,
          tx.value.toString(),
          receipt.gasUsed.toString(),
          tx.gasPrice?.toString() || "0",
          receipt.status,
          receipt.contractAddress,
          JSON.stringify(receipt.logs),
          new Date(block.timestamp * 1000),
        ],
      )
    } catch (error) {
      this.logger.error("Error storing transaction log:", error)
    }
  }

  async processLog(log, receipt) {
    try {
      const contractInfo = this.contracts.get(log.address.toLowerCase())
      if (!contractInfo) return

      const iface = new ethers.Interface(contractInfo.abi)
      const parsedLog = iface.parseLog(log)
      if (!parsedLog) return

      // Store event
      await this.storeEvent(log.address, parsedLog, receipt)

      // Emit to WebSocket clients
      this.io.to(`contract:${log.address}`).emit("event", {
        contractAddress: log.address,
        eventName: parsedLog.name,
        args: parsedLog.args,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash,
        timestamp: new Date(),
      })
    } catch (error) {
      this.logger.error("Error processing log:", error)
    }
  }

  async storeEvent(contractAddress, parsedLog, receipt) {
    try {
      await this.db.query(
        `
        INSERT INTO contract_events (
          contract_address, event_name, block_number, transaction_hash,
          log_index, event_data, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
        [
          contractAddress,
          parsedLog.name,
          receipt.blockNumber,
          receipt.transactionHash,
          receipt.logs.findIndex((l) => l.address === contractAddress),
          JSON.stringify(parsedLog.args),
        ],
      )
    } catch (error) {
      this.logger.error("Error storing event:", error)
    }
  }

  async handleEvent(contractAddress, eventName, args) {
    this.logger.info(`Event ${eventName} from ${contractAddress}:`, args)

    // Emit to specific event subscribers
    this.io.to(`event:${eventName}`).emit("event", {
      contractAddress,
      eventName,
      args,
      timestamp: new Date(),
    })
  }

  async updateTPSMetrics() {
    try {
      // Calculate TPS over last minute
      const oneMinuteAgo = new Date(Date.now() - 60000)
      const result = await this.db.query(
        `
        SELECT COUNT(*) as tx_count
        FROM transaction_logs
        WHERE timestamp > $1
      `,
        [oneMinuteAgo],
      )

      const tps = result.rows[0].tx_count / 60

      await this.db.query(
        `
        INSERT INTO realtime_metrics (metric_type, value)
        VALUES ('tps', $1)
      `,
        [tps],
      )

      // Cache in Redis
      await this.redis.set("current_tps", tps.toString(), { EX: 60 })

      // Emit to WebSocket clients
      this.io.emit("metrics", { type: "tps", value: tps })
    } catch (error) {
      this.logger.error("Error updating TPS metrics:", error)
    }
  }

  async updateBlockMetrics(block) {
    try {
      const blockTime = block.timestamp
      const prevBlock = await this.provider.getBlock(block.number - 1)

      if (prevBlock) {
        const latency = blockTime - prevBlock.timestamp

        await this.db.query(
          `
          INSERT INTO realtime_metrics (metric_type, value, block_number)
          VALUES ('latency', $1, $2)
        `,
          [latency, block.number],
        )

        this.io.emit("metrics", { type: "latency", value: latency })
      }
    } catch (error) {
      this.logger.error("Error updating block metrics:", error)
    }
  }

  stop() {
    this.isRunning = false
    this.provider.removeAllListeners()
    this.logger.info("Event listener stopped")
  }
}

module.exports = EventListener
