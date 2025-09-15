# Somnia DevLab

An all-in-one developer tool suite for the Somnia Network - the ultra-fast EVM-compatible L1 with 1M+ TPS and sub-second finality.

## Features

- **Realtime Event Streaming Dashboard** - Subscribe to contract events with live TPS, error rate, and latency charts
- **Replay/Timeline Viewer** - Scrub through block history and inspect state changes
- **Profiler/Bottleneck Analyzer** - Analyze gas consumption and identify performance bottlenecks
- **Auto Attack/Chaos Mode** - Stress test contracts with spam transactions and attack simulations
- **SDK & Documentation** - Simple JS/TS SDK for developers with auto-generated docs

## Quick Start

### Using Docker (Recommended)

\`\`\`bash
# Clone and start all services
git clone <repo-url>
cd somnia-devlab
npm run docker:up

# Access the dashboard
open http://localhost:3000
\`\`\`

### Manual Setup

\`\`\`bash
# Install dependencies
npm install
cd contracts && npm install && cd ..
cd backend && npm install && cd ..

# Start PostgreSQL and Redis
# (Install locally or use Docker)

# Compile and deploy contracts
npm run contracts:compile
npm run contracts:deploy

# Start backend
cd backend && npm run dev &

# Start frontend
npm run dev
\`\`\`

## Architecture

- **Frontend**: Next.js + React + TailwindCSS + D3.js
- **Backend**: Node.js + WebSocket + REST API
- **Database**: PostgreSQL (transaction logs & replay data)
- **Cache**: Redis (real-time data)
- **Contracts**: Solidity (sample ERC20 & MiniDEX)
- **Testing**: Hardhat + custom stress testing tools

## Usage

1. Deploy sample contracts to Somnia testnet
2. Run Chaos Mode to flood with transactions
3. Monitor real-time dashboard for TPS and errors
4. Use Replay Timeline to inspect specific blocks
5. Analyze gas profiling reports
6. Integrate with the SDK in your own projects

## SDK Example

\`\`\`javascript
import { SomniaStream } from "somnia-devlab";

// Subscribe to contract events
SomniaStream.on("Swap", (event) => {
  console.log("New swap:", event);
});

// Start monitoring
SomniaStream.connect("wss://your-devlab-instance.com");
\`\`\`

## Development

Built for hackathons - designed to be deployed and running within 2-4 days.

## License

MIT
