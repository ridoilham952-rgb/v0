const cron = require("node-cron")

class MetricsCollector {
  constructor(db, redis, io, logger) {
    this.db = db
    this.redis = redis
    this.io = io
    this.logger = logger
    this.isRunning = false
  }

  async start() {
    if (this.isRunning) return

    this.isRunning = true
    this.logger.info("Starting metrics collector...")

    // Collect metrics every 10 seconds
    cron.schedule("*/10 * * * * *", async () => {
      await this.collectMetrics()
    })

    // Clean old metrics every hour
    cron.schedule("0 * * * *", async () => {
      await this.cleanOldMetrics()
    })
  }

  async collectMetrics() {
    try {
      await Promise.all([
        this.collectTPSMetrics(),
        this.collectErrorRateMetrics(),
        this.collectGasMetrics(),
        this.collectLatencyMetrics(),
      ])
    } catch (error) {
      this.logger.error("Error collecting metrics:", error)
    }
  }

  async collectTPSMetrics() {
    try {
      const tenSecondsAgo = new Date(Date.now() - 10000)
      const result = await this.db.query(
        `
        SELECT COUNT(*) as tx_count
        FROM transaction_logs
        WHERE timestamp > $1
      `,
        [tenSecondsAgo],
      )

      const tps = result.rows[0].tx_count / 10

      await this.db.query(
        `
        INSERT INTO realtime_metrics (metric_type, value)
        VALUES ('tps', $1)
      `,
        [tps],
      )

      await this.redis.set("current_tps", tps.toString(), { EX: 300 })
      this.io.emit("metrics", { type: "tps", value: tps, timestamp: new Date() })
    } catch (error) {
      this.logger.error("Error collecting TPS metrics:", error)
    }
  }

  async collectErrorRateMetrics() {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000)
      const result = await this.db.query(
        `
        SELECT 
          COUNT(*) as total_tx,
          COUNT(CASE WHEN status = 0 THEN 1 END) as failed_tx
        FROM transaction_logs
        WHERE timestamp > $1
      `,
        [oneMinuteAgo],
      )

      const { total_tx, failed_tx } = result.rows[0]
      const errorRate = total_tx > 0 ? (failed_tx / total_tx) * 100 : 0

      await this.db.query(
        `
        INSERT INTO realtime_metrics (metric_type, value)
        VALUES ('error_rate', $1)
      `,
        [errorRate],
      )

      await this.redis.set("current_error_rate", errorRate.toString(), { EX: 300 })
      this.io.emit("metrics", { type: "error_rate", value: errorRate, timestamp: new Date() })
    } catch (error) {
      this.logger.error("Error collecting error rate metrics:", error)
    }
  }

  async collectGasMetrics() {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000)
      const result = await this.db.query(
        `
        SELECT AVG(gas_used::numeric) as avg_gas
        FROM transaction_logs
        WHERE timestamp > $1 AND gas_used > 0
      `,
        [oneMinuteAgo],
      )

      const avgGas = result.rows[0].avg_gas || 0

      await this.db.query(
        `
        INSERT INTO realtime_metrics (metric_type, value)
        VALUES ('avg_gas', $1)
      `,
        [avgGas],
      )

      await this.redis.set("current_avg_gas", avgGas.toString(), { EX: 300 })
      this.io.emit("metrics", { type: "avg_gas", value: avgGas, timestamp: new Date() })
    } catch (error) {
      this.logger.error("Error collecting gas metrics:", error)
    }
  }

  async collectLatencyMetrics() {
    try {
      const cached = await this.redis.get("current_latency")
      if (cached) {
        this.io.emit("metrics", {
          type: "latency",
          value: Number.parseFloat(cached),
          timestamp: new Date(),
        })
      }
    } catch (error) {
      this.logger.error("Error collecting latency metrics:", error)
    }
  }

  async getCurrentMetrics() {
    try {
      const [tps, errorRate, avgGas, latency] = await Promise.all([
        this.redis.get("current_tps"),
        this.redis.get("current_error_rate"),
        this.redis.get("current_avg_gas"),
        this.redis.get("current_latency"),
      ])

      return {
        tps: Number.parseFloat(tps) || 0,
        errorRate: Number.parseFloat(errorRate) || 0,
        avgGas: Number.parseFloat(avgGas) || 0,
        latency: Number.parseFloat(latency) || 0,
        timestamp: new Date(),
      }
    } catch (error) {
      this.logger.error("Error getting current metrics:", error)
      return { tps: 0, errorRate: 0, avgGas: 0, latency: 0, timestamp: new Date() }
    }
  }

  async cleanOldMetrics() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      await this.db.query(
        `
        DELETE FROM realtime_metrics
        WHERE timestamp < $1
      `,
        [twentyFourHoursAgo],
      )

      this.logger.info("Cleaned old metrics")
    } catch (error) {
      this.logger.error("Error cleaning old metrics:", error)
    }
  }

  stop() {
    this.isRunning = false
    this.logger.info("Metrics collector stopped")
  }
}

module.exports = MetricsCollector
