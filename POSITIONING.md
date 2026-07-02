# Avalanche Agent Hub 🔺

Open-source Avalanche-native toolkit for programmable on-chain quests and agent operations.

## One-line positioning

Avalanche Agent Hub helps developers and protocols launch on-chain quest flows, agent-linked operations, and wallet-aware automation on Avalanche without building the full stack from scratch.

## Why this exists

Avalanche has real momentum in:
- on-chain consumer activity
- quest / campaign distribution
- agentic product experiments
- protocol growth programs

But the tooling is fragmented:
- quest platforms are mostly closed SaaS
- agent tooling is usually chain-agnostic or off-chain-first
- wallet orchestration is often internal-only glue code
- Avalanche-specific developer primitives are still thin

Avalanche Agent Hub exists to give builders an open, programmable base layer instead of another black-box campaign UI.

## Current wedge

Not “everything for AI agents.”

The strongest current wedge is:
- Avalanche-native
- developer-first
- open-source
- quest + agent operations in one stack
- live on-chain proof via dashboard + contracts

## What it sells

### For protocol teams
- Launch programmable on-chain quests
- Track completion against real chain activity
- Add reward distribution and contract-backed flows
- Start from reusable primitives instead of custom campaign code

### For developers
- Build on Avalanche faster with a usable TypeScript package
- Reuse quest, contract, and wallet-oriented building blocks
- Fork / self-host instead of depending on a closed platform

### For ecosystem / grants
- Open-source infrastructure for Avalanche-native growth loops
- Credible product surface: contracts, npm package, dashboard, docs
- Clear path from grant prototype → protocol tooling

## Product surfaces

### 1. Smart contracts
- `QuestFactory.sol`
- `AgentRegistry.sol`

Purpose:
- on-chain quest lifecycle
- reward escrow / claims
- agent registration and activity-linked state

### 2. TypeScript package
- npm: `agent-hub-avax@0.1.0`
- package name today: `agent-hub-avax`

Current repo/package state is a single published package. Longer-term modular split (`@agent-hub/quest`, `@agent-hub/agent`, `@agent-hub/wallet`) is still architecture direction, not the current published reality.

### 3. Dashboard
- Next.js app under `dashboard/`
- production URL: `https://dashboard-mauve-eight-44.vercel.app`

What it proves now:
- live Fuji RPC snapshot
- current block / gas / deployer balance
- bytecode presence of deployed contracts
- public on-chain proof, not mock marketing counters

## Current proof points

- npm package published
- Fuji testnet contracts deployed
- critical security issues fixed and re-deployed
- public dashboard now shows live Fuji RPC data
- landing page / pitch / docs already exist
- Team1 Mini Grant submitted

## Who this is for first

Primary ICP:
- Avalanche-native protocol teams
- growth / ecosystem teams running quest campaigns
- devs building campaign rails, wallet ops, or agent-linked products on Avalanche

Secondary ICP:
- builders who want a self-hostable alternative to closed quest platforms
- grant reviewers looking for infrastructure that can support multiple ecosystem teams

## Why it can win

Compared with quest networks, generic agent SDKs, and generic wallet infra, Agent Hub can occupy a narrower but more defensible position:
- not just consumer quest distribution
- not just generic AI-agent tooling
- not just wallet/auth/contracts abstraction
- but embedded Avalanche-native infrastructure for agent actions, wallet-aware ops, and programmable rewards

## Where to be careful

The product story gets weaker when framed too broadly.

Avoid leading with:
- “full AI agent platform”
- “everything for web3 builders”
- “general multi-chain automation suite”

Lead with:
- programmable on-chain quests
- Avalanche-native growth infrastructure
- open-source agent + wallet-aware operations

## Current URLs

- GitHub: https://github.com/agenthubavax/avalanche-agent-hub
- Landing page: https://agenthubavax.github.io/avalanche-agent-hub/
- Dashboard: https://dashboard-mauve-eight-44.vercel.app
- npm: https://www.npmjs.com/package/agent-hub-avax
- Twitter: https://x.com/AgentHubAvax

## Near-term roadmap focus

1. Keep quest + agent infrastructure story sharp
2. Fix / confirm CI and contract test status
3. Deepen competitor map with fresher external evidence
4. Add protocol integration examples (Trader Joe / Benqi / Yield Yak)
5. Move from “prototype story” to “protocol-ready starter stack”
