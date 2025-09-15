const { ethers } = require("ethers")

class StressTestRunner {
  constructor(provider, db, logger) {
    this.provider = provider
    this.db = db
    this.logger = logger
    this.activeTests = new Map()
  }

  async startTest(contractAddress, testConfig) {
    const testId = `test_${Date.now()}`
    const {
      testName = "Stress Test",
      transactionCount = 100,
      concurrency = 10,
      testType = "spam", // 'spam', 'reentrancy', 'revert_loop'
      gasLimit = 100000,
    } = testConfig

    this.logger.info(`Starting stress test ${testId} for contract ${contractAddress}`)

    const testData = {
      id: testId,
      contractAddress,
      testName,
      transactionCount,
      concurrency,
      testType,
      gasLimit,
      startTime: new Date(),
      transactions: [],
      results: {
        successful: 0,
        failed: 0,
        totalLatency: 0,
        maxLatency: 0,
      },
    }

    this.activeTests.set(testId, testData)

    // Run test asynchronously
    this.runTest(testData).catch((error) => {
      this.logger.error(`Stress test ${testId} failed:`, error)
    })

    return testId
  }

  async runTest(testData) {
    const { id, contractAddress, transactionCount, concurrency, testType, gasLimit } = testData

    try {
      // Create wallet for testing (in production, use a dedicated test wallet)
      const wallet = new ethers.Wallet(
        process.env.TEST_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey,
        this.provider,
      )

      // Create batches of transactions
      const batches = []
      for (let i = 0; i < transactionCount; i += concurrency) {
        const batch = []
        for (let j = 0; j < concurrency && i + j < transactionCount; j++) {
          batch.push(this.createTestTransaction(wallet, contractAddress, testType, gasLimit))
        }
        batches.push(batch)
      }

      // Execute batches
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(batch)

        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            testData.results.successful++
            const latency = result.value.latency
            testData.results.totalLatency += latency
            testData.results.maxLatency = Math.max(testData.results.maxLatency, latency)
          } else {
            testData.results.failed++
            this.logger.warn(`Transaction failed:`, result.reason)
          }
        })

        // Small delay between batches to avoid overwhelming the network
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Calculate final results
      const endTime = new Date()
      const duration = (endTime - testData.startTime) / 1000
      const avgTPS = transactionCount / duration
      const avgLatency = testData.results.totalLatency / testData.results.successful || 0

      // Store results in database
      await this.db.query(
        `
        INSERT INTO stress_test_results (
          test_name, total_transactions, successful_transactions, failed_transactions,
          average_tps, average_latency_ms, max_latency_ms, test_duration_seconds,
          test_config, started_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          testData.testName,
          transactionCount,
          testData.results.successful,
          testData.results.failed,
          avgTPS,
          avgLatency,
          testData.results.maxLatency,
          duration,
          JSON.stringify({ contractAddress, testType, gasLimit, concurrency }),
          testData.startTime,
          endTime,
        ],
      )

      this.logger.info(`Stress test ${id} completed:`, {
        duration,
        avgTPS,
        avgLatency,
        successful: testData.results.successful,
        failed: testData.results.failed,
      })
    } catch (error) {
      this.logger.error(`Error running stress test ${id}:`, error)
    } finally {
      this.activeTests.delete(id)
    }
  }

  async createTestTransaction(wallet, contractAddress, testType, gasLimit) {
    const startTime = Date.now()

    try {
      let tx

      switch (testType) {
        case "spam":
          // Simple value transfer
          tx = await wallet.sendTransaction({
            to: contractAddress,
            value: ethers.parseEther("0.001"),
            gasLimit,
          })
          break

        case "contract_call":
          // Call a contract function (assuming ERC20 transfer)
          const contract = new ethers.Contract(
            contractAddress,
            ["function transfer(address to, uint256 amount) returns (bool)"],
            wallet,
          )
          tx = await contract.transfer(wallet.address, 1, { gasLimit })
          break

        case "revert_loop":
          // Intentionally failing transaction
          tx = await wallet.sendTransaction({
            to: contractAddress,
            data: "0xdeadbeef", // Invalid function selector
            gasLimit,
          })
          break

        default:
          throw new Error(`Unknown test type: ${testType}`)
      }

      const receipt = await tx.wait()
      const latency = Date.now() - startTime

      return {
        hash: tx.hash,
        success: receipt.status === 1,
        gasUsed: receipt.gasUsed.toString(),
        latency,
      }
    } catch (error) {
      const latency = Date.now() - startTime
      throw { error: error.message, latency }
    }
  }

  getTestStatus(testId) {
    return this.activeTests.get(testId) || null
  }

  getAllActiveTests() {
    return Array.from(this.activeTests.values())
  }
}

module.exports = StressTestRunner
