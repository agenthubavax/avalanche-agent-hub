# Benqi Lending Quest — Protocol Example

> Second protocol example: how Benqi (Avalanche's leading lending protocol)
> can use Agent Hub to create a supply/borrow quest campaign.

## The Scenario

Benqi wants to onboard new lenders. They create a quest:

**"Supply $100+ worth of AVAX to Benqi → Earn 25 QI tokens"**

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Benqi Team  │────▶│ QuestFactory │────▶│  Quest Contract  │
│  (create)    │     │  (on-chain)  │     │  (25 QI reward)  │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                    │
┌─────────────┐     ┌──────────────┐               │
│  Verifier    │────▶│ Check Benqi  │───────────────┘
│  Bot         │     │ Supply events│        completeQuest()
└─────────────┘     └──────────────┘               │
                                                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  User        │────▶│ claimReward()│────▶│  25 QI tokens   │
│  (lender)    │     │  (pull)      │     │  transferred     │
└─────────────┘     └──────────────┘     └─────────────────┘
```

## Key Contracts (Avalanche Mainnet)

| Contract | Address |
|----------|---------|
| Benqi Comptroller | `0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4` |
| qiAVAX (cAVAX) | `0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c` |
| QI Token | `0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5` |

## Files

| File | Purpose |
|------|---------|
| `create-quest.js` | Create + fund Benqi supply quest |
| `verify-completion.js` | Monitor Benqi Mint events |
| `user-claim.js` | User claims QI reward |

## How It Works

### Verification Logic

The verifier monitors Benqi's `Mint` event on qiAVAX:

```solidity
event Mint(address minter, uint256 mintAmount, uint256 mintTokens);
```

When a user's cumulative supply exceeds $100 worth of AVAX:
1. Verifier calls `completeQuest(userAddress)`
2. User can claim 25 QI tokens

### SDK Usage

```javascript
const { QuestSDK } = require('agent-hub-avax');

const sdk = new QuestSDK({ rpcUrl, privateKey });

const quest = await sdk.createQuest({
  title: 'Benqi Supply Challenge',
  description: 'Supply $100+ AVAX to Benqi lending pool',
  rewardToken: QI_TOKEN_ADDRESS,
  rewardAmount: ethers.parseEther('25'),
  maxCompletions: 500,
  verificationData: ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256'],
    [BENQI_COMPTROLLER, ethers.parseEther('100')] // $100 minimum
  ),
});

await quest.fundQuest(ethers.parseEther('12500')); // 500 * 25 QI
```

## Extending

- **Multi-asset supply**: Accept AVAX, USDC, or ETH
- **Borrow quests**: Supply + borrow combo for higher rewards
- **Duration-based**: Must maintain supply for 7+ days
- **Cross-protocol**: Supply on Benqi + swap on Trader Joe in same quest

---

*Part of the Avalanche Agent Hub protocol examples series.*
