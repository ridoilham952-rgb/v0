import { io, type Socket } from "socket.io-client"
import type { DevLabConfig, ContractEvent, MetricsData, EventCallback, MetricsCallback } from "./types"

/**
 * Real-time event streaming for Somnia contracts
 */
export class SomniaStream {
  private config: DevLabConfig
  private socket: Socket | null = null
  private eventCallbacks: Map<string, EventCallback[]> = new Map()
  private metricsCallbacks: MetricsCallback[] = []
  private isConnected = false

  constructor(config: DevLabConfig) {
    this.config = config
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.config.wsUrl, {
        transports: ["websocket"],
      })

      this.socket.on("connect", () => {
        this.isConnected = true
        console.log("Connected to Somnia DevLab")
        resolve()
      })

      this.socket.on("disconnect", () => {
        this.isConnected = false
        console.log("Disconnected from Somnia DevLab")
      })

      this.socket.on("event", (eventData: any) => {
        const event: ContractEvent = {
          contractAddress: eventData.contractAddress,
          eventName: eventData.eventName,
          args: eventData.args,
          blockNumber: eventData.blockNumber,
          transactionHash: eventData.transactionHash,
          timestamp: new Date(eventData.timestamp),
        }

        this.handleEvent(event)
      })

      this.socket.on("metrics", (metricsData: any) => {
        const metrics: MetricsData = {
          tps: metricsData.value,
          errorRate: 0, // Will be enhanced
          latency: 0,
          avgGas: 0,
          timestamp: new Date(metricsData.timestamp),
        }

        this.handleMetrics(metrics)
      })

      this.socket.on("connect_error", (error) => {
        reject(error)
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error("Connection timeout"))
        }
      }, 10000)
    })
  }

  /**
   * Subscribe to contract events
   */
  on(eventName: string, callback: EventCallback): void
  on(eventName: "metrics", callback: MetricsCallback): void
  on(eventName: string, callback: EventCallback | MetricsCallback): void {
    if (eventName === "metrics") {
      this.metricsCallbacks.push(callback as MetricsCallback)
    } else {
      if (!this.eventCallbacks.has(eventName)) {
        this.eventCallbacks.set(eventName, [])
      }
      this.eventCallbacks.get(eventName)!.push(callback as EventCallback)
    }
  }

  /**
   * Subscribe to specific contract events
   */
  subscribe(contractAddress: string, eventTypes?: string[]): void {
    if (!this.socket || !this.isConnected) {
      throw new Error("Not connected to Somnia DevLab")
    }

    this.socket.emit("subscribe", {
      contractAddress,
      eventTypes,
    })
  }

  /**
   * Unsubscribe from contract events
   */
  unsubscribe(contractAddress: string): void {
    if (!this.socket || !this.isConnected) {
      throw new Error("Not connected to Somnia DevLab")
    }

    this.socket.emit("unsubscribe", {
      contractAddress,
    })
  }

  /**
   * Remove event listener
   */
  off(eventName: string, callback?: EventCallback | MetricsCallback): void {
    if (eventName === "metrics") {
      if (callback) {
        const index = this.metricsCallbacks.indexOf(callback as MetricsCallback)
        if (index > -1) {
          this.metricsCallbacks.splice(index, 1)
        }
      } else {
        this.metricsCallbacks = []
      }
    } else {
      const callbacks = this.eventCallbacks.get(eventName)
      if (callbacks) {
        if (callback) {
          const index = callbacks.indexOf(callback as EventCallback)
          if (index > -1) {
            callbacks.splice(index, 1)
          }
        } else {
          this.eventCallbacks.set(eventName, [])
        }
      }
    }
  }

  /**
   * Check connection status
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  private handleEvent(event: ContractEvent): void {
    // Call event-specific callbacks
    const callbacks = this.eventCallbacks.get(event.eventName)
    if (callbacks) {
      callbacks.forEach((callback) => callback(event))
    }

    // Call generic event callbacks
    const allCallbacks = this.eventCallbacks.get("*")
    if (allCallbacks) {
      allCallbacks.forEach((callback) => callback(event))
    }
  }

  private handleMetrics(metrics: MetricsData): void {
    this.metricsCallbacks.forEach((callback) => callback(metrics))
  }
}
