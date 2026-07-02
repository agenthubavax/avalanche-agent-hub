# Avalanche Agent Hub 🔺

Open-source Avalanche-native toolkit for programmable on-chain quests and agent operations.

## Why?

Avalanche has capital, users, ecosystem programs, and growing interest in agentic products. But builders still face the same repetitive infra work:
- custom quest logic
- wallet-aware automation glue
- reward distribution flows
- dashboard proof for grants / protocols
- fragmented tooling across agent, wallet, and campaign layers

Avalanche Agent Hub exists to reduce that setup cost with an open, developer-first base layer.

## What it is

Avalanche Agent Hub is a product + infra starter stack for:
- programmable on-chain quests
- agent-linked operations
- wallet-aware automation on Avalanche

Today it includes:
- Fuji-deployed contracts
- a published TypeScript package: `agent-hub-avax@0.1.0`
- a public live-RPC dashboard
- landing page, pitch deck, and strategy docs

## Sharp positioning

Best current framing:

> Avalanche Agent Hub is an open-source Avalanche-native toolkit for programmable on-chain quests and agent operations.

Avoid broader framing like “everything platform for AI agents.”

That is too wide for the current product state and weakens the wedge.

## What makes it different

### 1. Avalanche-native
Built around Avalanche deployment, Avalanche ecosystem use-cases, and Avalanche distribution paths.

### 2. Developer-first
This is not only a campaign UI. It is code-first:
- contracts
- package
- dashboard
- extensible primitives

### 3. Open-source
Teams can inspect, fork, and self-host. That matters for grants, protocol trust, and ecosystem adoption.

### 4. Embedded quest + wallet + agent operations
Many alternatives only own one layer:
- generic agent tooling
- quest marketplaces
- community gamification
- wallet/API infrastructure

Agent Hub’s best story is the combination: agent-linked actions, wallet-aware operations, and programmable quest rails inside one Avalanche-native stack.

### 5. Live on-chain proof
Public dashboard now shows live Fuji RPC data instead of mock KPIs.
That is stronger for grant credibility than a static landing page alone.

## Core surfaces

### Smart contracts
- `contracts/QuestFactory.sol`
- `contracts/AgentRegistry.sol`

### npm package
- package: `agent-hub-avax`
- version: `0.1.0`
- npm: https://www.npmjs.com/package/agent-hub-avax

### Dashboard
- app path: `dashboard/`
- production URL: https://dashboard-mauve-eight-44.vercel.app
- shows live Fuji RPC snapshot, latest block, gas, deployer balance, contract bytecode presence

## Current product truth

Published reality today:
- one package: `agent-hub-avax`
- Fuji testnet contracts deployed
- public dashboard live
- Team1 grant submitted

Architecture direction for later:
- possible modular split into scoped packages like `@agent-hub/quest`, `@agent-hub/agent`, `@agent-hub/wallet`

That split is still future direction, not current external product truth.

## Primary target users

### Primary ICP
- Avalanche-native protocol teams
- ecosystem / growth teams running quests or incentives
- developers building wallet-aware quest rails or agent-linked products on Avalanche

### Secondary ICP
- teams wanting self-hostable alternatives to closed campaign platforms
- grant reviewers / ecosystem partners evaluating reusable infra

## What to emphasize in pitches

1. Open-source Avalanche-native infra, not just another campaign frontend
2. Programmable on-chain quest + reward rails
3. Live proof: contracts + dashboard + npm package already exist

## Links

- GitHub: https://github.com/agenthubavax/avalanche-agent-hub
- Landing page: https://agenthubavax.github.io/avalanche-agent-hub/
- Dashboard: https://dashboard-mauve-eight-44.vercel.app
- npm: https://www.npmjs.com/package/agent-hub-avax
- Twitter: https://x.com/AgentHubAvax

## Next doc

For competitor map and market wedge, read `COMPETITION.md`.
