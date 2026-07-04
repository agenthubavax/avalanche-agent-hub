# Trader Joe Swap Quest — Protocol Example

> A real-world example showing how a protocol team (Trader Joe) can use
> Avalanche Agent Hub to create an on-chain quest campaign.

## The Scenario

Trader Joe wants to incentivize new users to try their DEX. They create a quest:

**"Complete 10 swaps on Trader Joe DEX → Earn 50 JOE tokens"**

This example shows the full flow:
1. Protocol team creates the quest on-chain
2. Users complete swaps (verified via on-chain events)
3. Rewards are distributed automatically

## Prerequisites

```bash
npm install agent-hub-avax ethers
```

Environment:
```bash
RPC_URL=https://api.avax.network/ext/bc/C/rpc
PRIVATE_KEY=<protocol-team-private-key>
VERIFIER_ADDRESS=<verifier-bot-address>
```

## Files

| File | Purpose |
|------|---------|
| `create-quest.js` | Protocol team creates + funds the quest |
| `verify-completion.js` | Verifier bot checks swaps + completes quest |
| `user-claim.js` | User claims their reward |
| `README.md` | This file |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Protocol Team  │────▶│  QuestFactory    │────▶│  Quest Contract │
│  (create+fund)  │     │  (on-chain)      │     │  (per-quest)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
┌─────────────────┐     ┌──────────────────┐            │
│  Verifier Bot   │────▶│  Check on-chain  │────────────┘
│  (off-chain)    │     │  swap events     │     completeQuest()
└─────────────────┘     └──────────────────┘            │
                                                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User           │────▶│  claimReward()   │────▶│  JOE tokens     │
│  (quest doer)   │     │  (pull pattern)  │     │  transferred    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## How It Works

### Step 1: Create Quest (Protocol Team)

The Trader Joe team runs `create-quest.js` which:
- Deploys a new quest via QuestFactory
- Defines tasks: "Swap on Trader Joe Router"
- Sets reward: 50 JOE per user, max 1000 completions
- Funds the quest with 50,000 JOE tokens (escrowed on-chain)

### Step 2: Verify Completion (Verifier Bot)

An off-chain verifier monitors Trader Joe's Router contract events:
- Counts swaps per user address
- When a user hits 10 swaps → calls `completeQuest(userAddress)`
- Reward is escrowed and claimable

### Step 3: Claim Reward (User)

The user calls `claimReward()`:
- Pull pattern (user initiates, not push)
- ReentrancyGuard protected
- 50 JOE transferred to user's wallet

## Key SDK Features Demonstrated

| Feature | How it's used |
|---------|---------------|
| Quest creation | `sdk.createQuest()` with on-chain state |
| Token escrow | `fundQuest()` locks rewards in contract |
| Verifier pattern | Only authorized verifier can complete quests |
| Per-user tracking | Same user can't complete twice |
| Pull-over-push | User claims reward (prevents reentrancy) |
| Custom errors | Gas-optimized error handling |
| UUPS upgradeable | Quest logic can be upgraded without state loss |

## Why This Matters

Without Agent Hub, Trader Joe would need to:
1. Write custom quest smart contract (~500 lines)
2. Build verification logic (~200 lines)
3. Implement reward distribution (~150 lines)
4. Create escrow mechanism (~100 lines)
5. Add security measures (~200 lines)

Total: ~1,150 lines of custom code per campaign.

With Agent Hub:
```javascript
const quest = await sdk.createQuest({ ... });
await quest.fundQuest(amount);
// Done. ~10 lines.
```

## Extending This Example

- **Multi-task quests**: Add social tasks (follow Twitter, join Discord) alongside on-chain tasks
- **Tiered rewards**: Different reward amounts based on swap volume
- **Time-limited quests**: Set expiry timestamps
- **Cross-protocol quests**: Combine Trader Joe swaps with Benqi deposits

---

*Part of the Avalanche Agent Hub protocol examples series.*
*GitHub: github.com/agenthubavax/avalanche-agent-hub*
