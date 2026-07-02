# Avalanche Agent Hub 🔺

Open-source developer toolkit for deploying AI agents and managing multi-wallet operations on Avalanche.

## Why?

The Avalanche ecosystem has 550+ active projects and is pushing into the agentic economy (KiteAI: $33M funded, 715M+ agent calls). But there's no open-source toolkit that makes it easy to:

- Deploy AI agents on Avalanche C-Chain/L1s
- Manage multi-wallet operations at scale
- Create and verify on-chain quest systems
- Monitor agent activity across the ecosystem

## Modules

### Quest SDK
Create, distribute, and verify on-chain quests.

```typescript
import { AgentHub } from '@agent-hub/core';

const hub = AgentHub({ network: 'mainnet' });

// Create a quest
const quest = await hub.quest.create({
  title: "Complete 5 swaps on Trader Joe",
  chain: "C-Chain",
  tasks: [
    { type: "on-chain", contract: "0x...", method: "swap", count: 5 },
    { type: "social", platform: "twitter", action: "follow" }
  ],
  rewards: { token: "AVAX", amount: 0.1 }
});

// Verify completion
const status = await hub.quest.verify({
  questId: quest.id,
  wallet: "0x..."
});
```

### Agent Kit
Deploy AI agent templates on Avalanche.

```typescript
// Deploy a trading agent
const agent = await hub.agent.deploy({
  type: "trader",
  wallet: encryptedWallet,
  rules: {
    maxTradeSize: "100 USDC",
    allowedTokens: ["AVAX", "USDC"],
    stopLoss: "5%"
  }
});

// Monitor agent activity
const activity = await hub.agent.status(agent.id);
```

### Wallet Manager
Multi-wallet management with encryption.

```typescript
// Import multiple wallets
const wallets = await hub.wallet.import({
  file: "./accounts.json",
  encryption: "AES-256"
});

// Portfolio across all wallets
const portfolio = await hub.wallet.portfolio(wallets);
```

## Installation

```bash
npm install @agent-hub/core
```

## Quick Start

```typescript
import { AgentHub } from '@agent-hub/core';

const hub = AgentHub({
  network: 'mainnet',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
});

// Your code here
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              Avalanche Agent Hub             │
├─────────────┬─────────────┬─────────────────┤
│  Quest SDK  │ Agent Kit   │ Wallet Manager  │
├─────────────┴─────────────┴─────────────────┤
│         @avalanche-sdk/client (base)         │
├─────────────────────────────────────────────┤
│    Avalanche C-Chain / L1s / Subnets        │
└─────────────────────────────────────────────┘
```

## Roadmap

- [ ] Quest SDK core (create + verify)
- [ ] Agent Kit (deploy templates)
- [ ] Wallet Manager (multi-wallet + encryption)
- [ ] Dashboard UI
- [ ] KiteAI integration
- [ ] Cross-L1 support
- [ ] Documentation site

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

MIT

## Built with

- [Avalanche SDK](https://github.com/ava-labs/avalanche-sdk-typescript)
- [ethers.js](https://docs.ethers.org/)
- [TypeScript](https://www.typescriptlang.org/)

## Contact

- GitHub: [rmndkyl](https://github.com/rmndkyl)
- Twitter: [@layerairdrop](https://twitter.com/layerairdrop)
