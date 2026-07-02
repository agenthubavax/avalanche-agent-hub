# Avalanche Agent Hub — Fuji Testnet Deployment

**Date:** 2026-07-02
**Network:** Fuji Testnet (Chain ID 43113)
**Deployer:** 0xDEDB5f8746F50620CBc9d8b7aF5F331969CbD2A4

## Contract Addresses

| Contract | Address | Snowtrace |
|----------|---------|-----------|
| AgentRegistry | `0x782729F1ae1fdfe23E6667790e43Fb55B0119C09` | [View](https://testnet.snowtrace.io/address/0x782729F1ae1fdfe23E6667790e43Fb55B0119C09) |
| QuestFactory | `0xF2F2Bf3614E25A4eB31b287c0272111350bf1cE9` | [View](https://testnet.snowtrace.io/address/0xF2F2Bf3614E25A4eB31b287c0272111350bf1cE9) |

## Gas Used

- AgentRegistry: ~2.5M gas
- QuestFactory: ~3.2M gas

## Verification

To verify contracts on Snowtrace:
```bash
npx hardhat verify --network fuji 0x782729F1ae1fdfe23E6667790e43Fb55B0119C09
npx hardhat verify --network fuji 0xF2F2Bf3614E25A4eB31b287c0272111350bf1cE9
```
