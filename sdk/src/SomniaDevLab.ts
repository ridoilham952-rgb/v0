import { SomniaStream } from "./SomniaStream"
import { GasProfiler } from "./GasProfiler"
import { ChaosMode } from "./ChaosMode"
import { ReplayViewer } from "./ReplayViewer"
import type { DevLabConfig } from "./types"

/**
 * Main SDK class for Somnia DevLab
 * Provides access to all development tools and monitoring capabilities
 */
export class SomniaDevLab {
  private config: DevLabConfig
  public stream: SomniaStream
  public profiler: GasProfiler
  public chaos: ChaosMode
  public replay: ReplayViewer

  constructor(config: DevLabConfig) {
    this.config = config
    this.stream = new SomniaStream(config)
    this.profiler = new GasProfiler(config)
    this.chaos = new ChaosMode(config)
    this.replay = new ReplayViewer(config)
  }

  /**
   * Initialize all SDK components
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.stream.connect(),
      this.profiler.initialize(),
      this.chaos.initialize(),
      this.replay.initialize(),
    ])
  }

  /**
   * Get current network metrics
   */
  async getMetrics(): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/api/metrics/realtime`, {
      headers: this.getHeaders(),
    })
    return response.json()
  }

  /**
   * Get contract events
   */
  async getEvents(
    contractAddress: string,
    options?: {
      eventName?: string
      blockNumber?: number
      limit?: number
    },
  ): Promise<any[]> {
    const params = new URLSearchParams({
      contractAddress,
      ...(options?.eventName && { eventName: options.eventName }),
      ...(options?.blockNumber && { blockNumber: options.blockNumber.toString() }),
      ...(options?.limit && { limit: options.limit.toString() }),
    })

    const response = await fetch(`${this.config.apiUrl}/api/events?${params}`, {
      headers: this.getHeaders(),
    })
    return response.json()
  }

  /**
   * Get transaction logs
   */
  async getTransactions(options?: {
    blockNumber?: number
    limit?: number
  }): Promise<any[]> {
    const params = new URLSearchParams({
      ...(options?.blockNumber && { blockNumber: options.blockNumber.toString() }),
      ...(options?.limit && { limit: options.limit.toString() }),
    })

    const response = await fetch(`${this.config.apiUrl}/api/transactions?${params}`, {
      headers: this.getHeaders(),
    })
    return response.json()
  }

  /**
   * Disconnect all connections
   */
  async disconnect(): Promise<void> {
    await Promise.all([this.stream.disconnect(), this.profiler.cleanup(), this.chaos.cleanup(), this.replay.cleanup()])
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }
}
