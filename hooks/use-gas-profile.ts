"use client"

import { useState, useEffect } from "react"

interface GasProfileData {
  function_name: string
  avg_gas: number
  max_gas: number
  min_gas: number
  call_count: number
  avg_execution_time: number
}

interface Hotspot {
  function_name: string
  severity: string
  description: string
  gas_impact: number
  frequency: number
  optimization_potential: number
  suggestions: string[]
}

interface Recommendation {
  title: string
  description: string
  impact: string
  estimated_savings: string
  difficulty: string
  code_example?: string
}

export function useGasProfile(contractAddress: string | null) {
  const [profileData, setProfileData] = useState<GasProfileData[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const startProfiling = async (contractAddress: string, config: any) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiling/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractAddress, config }),
        },
      )

      if (response.ok) {
        // Simulate profiling delay
        setTimeout(() => {
          fetchProfileData(contractAddress)
        }, 2000)
      }
    } catch (error) {
      console.error("Error starting profiling:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProfileData = async (contractAddress: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiling?contractAddress=${contractAddress}`,
      )

      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        generateHotspots(data)
        generateRecommendations(data)
      }
    } catch (error) {
      console.error("Error fetching profile data:", error)
    }
  }

  const generateHotspots = (data: GasProfileData[]) => {
    const hotspots: Hotspot[] = data
      .filter((item) => item.avg_gas > 50000)
      .map((item) => ({
        function_name: item.function_name,
        severity: item.avg_gas > 200000 ? "High" : item.avg_gas > 100000 ? "Medium" : "Low",
        description: `Function consumes ${Math.round(item.avg_gas).toLocaleString()} gas on average`,
        gas_impact: item.avg_gas * item.call_count,
        frequency: Math.min(100, (item.call_count / Math.max(...data.map((d) => d.call_count))) * 100),
        optimization_potential: Math.min(80, Math.max(10, (item.avg_gas - 21000) / 1000)),
        suggestions: [
          "Consider using more efficient data structures",
          "Optimize loops and conditional statements",
          "Cache frequently accessed values",
          "Use events instead of storage for non-critical data",
        ],
      }))

    setHotspots(hotspots)
  }

  const generateRecommendations = (data: GasProfileData[]) => {
    const recs: Recommendation[] = [
      {
        title: "Optimize Storage Operations",
        description:
          "Storage operations (SSTORE) are expensive. Consider batching updates or using memory when possible.",
        impact: "high",
        estimated_savings: "20-40% gas reduction",
        difficulty: "Medium",
        code_example: `// Instead of multiple SSTORE operations
mapping(address => uint256) balances;
mapping(address => uint256) timestamps;

// Use a struct for batched storage
struct UserData {
    uint256 balance;
    uint256 timestamp;
}
mapping(address => UserData) userData;`,
      },
      {
        title: "Use Events for Non-Critical Data",
        description: "Events are much cheaper than storage for data that doesn't need to be accessed by contracts.",
        impact: "medium",
        estimated_savings: "60-80% for logged data",
        difficulty: "Easy",
        code_example: `// Instead of storing in state
mapping(uint256 => string) public logs;

// Use events
event LogEntry(uint256 indexed id, string message);`,
      },
      {
        title: "Implement Circuit Breakers",
        description: "Add limits to prevent excessive gas consumption during attacks.",
        impact: "high",
        estimated_savings: "Prevents gas griefing",
        difficulty: "Medium",
        code_example: `uint256 public constant MAX_GAS_PER_TX = 500000;

modifier gasLimit() {
    uint256 gasStart = gasleft();
    _;
    require(gasStart - gasleft() <= MAX_GAS_PER_TX, "Gas limit exceeded");
}`,
      },
    ]

    setRecommendations(recs)
  }

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      contractAddress,
      profileData,
      hotspots,
      recommendations,
      summary: {
        totalFunctions: profileData.length,
        avgGasPerFunction: profileData.reduce((acc, item) => acc + item.avg_gas, 0) / profileData.length,
        highGasFunctions: profileData.filter((item) => item.avg_gas > 100000).length,
        optimizationOpportunities: hotspots.length,
      },
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gas-profile-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (contractAddress) {
      fetchProfileData(contractAddress)
    }
  }, [contractAddress])

  return {
    profileData,
    hotspots,
    recommendations,
    isLoading,
    startProfiling,
    exportReport,
  }
}
