/**
 * Trader Joe Swap Quest — Verify & Complete
 *
 * Verifier bot: monitors Trader Joe Router swap events,
 * counts swaps per user, and completes quests when threshold met.
 *
 * Usage:
 *   RPC_URL=https://api.avax.network/ext/bc/C/rpc \
 *   PRIVATE_KEY=<verifier-key> \
 *   QUEST_ADDRESS=<deployed-quest-address> \
 *   TRADER_JOE_ROUTER=<router-address> \
 *   node verify-completion.js
 */

const { ethers } = require('ethers');

// --- Config ---
const RPC_URL = process.env.RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const QUEST_ADDRESS = process.env.QUEST_ADDRESS;
const TRADER_JOE_ROUTER = process.env.TRADER_JOE_ROUTER || '0x60aE616a2155Ee3d9A6889781f7A9e6Ea24C6905';
const MIN_SWAPS = parseInt(process.env.MIN_SWAPS || '10');

if (!PRIVATE_KEY || !QUEST_ADDRESS) {
  console.error('Missing env: PRIVATE_KEY, QUEST_ADDRESS');
  process.exit(1);
}

// --- ABIs ---
const QUEST_ABI = [
  'function completeQuest(address user) external',
  'function completions(address user) view returns (bool)',
  'function totalCompletions() view returns (uint256)',
  'function maxCompletions() view returns (uint256)',
  'function isComplete() view returns (bool)',
];

// Trader Joe Router Swap event (simplified)
const ROUTER_ABI = [
  'event Swap(address indexed sender, uint256 amount0In, uint256 amount1Out, address indexed to)',
];

// --- Swap counter (in-memory, production would use DB) ---
const swapCounts = new Map();

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const verifier = new ethers.Wallet(PRIVATE_KEY, provider);
  const quest = new ethers.Contract(QUEST_ADDRESS, QUEST_ABI, verifier);
  const router = new ethers.Contract(TRADER_JOE_ROUTER, ROUTER_ABI, provider);

  console.log('--- Trader Joe Swap Quest Verifier ---');
  console.log('Verifier:', verifier.address);
  console.log('Quest:', QUEST_ADDRESS);
  console.log('Router:', TRADER_JOE_ROUTER);
  console.log('Min swaps:', MIN_SWAPS);

  const isComplete = await quest.isComplete();
  if (isComplete) {
    console.log('Quest is fully completed (max reached). Exiting.');
    return;
  }

  console.log('\nListening for Swap events on Trader Joe Router...\n');

  // --- Listen for new swaps ---
  router.on('Swap', async (sender, amount0In, amount1Out, to, event) => {
    const user = sender;

    // Skip if already completed
    const alreadyCompleted = await quest.completions(user);
    if (alreadyCompleted) return;

    // Count swaps
    const current = swapCounts.get(user) || 0;
    const newCount = current + 1;
    swapCounts.set(user, newCount);

    console.log(`[SWAP] ${user} — ${newCount}/${MIN_SWAPS} swaps`);

    // --- User hit threshold? Complete quest ---
    if (newCount >= MIN_SWAPS) {
      console.log(`\n[COMPLETE] ${user} reached ${MIN_SWAPS} swaps!`);

      try {
        const tx = await quest.completeQuest(user);
        await tx.wait();
        console.log(`[DONE] Quest completed for ${user} — tx: ${tx.hash}`);
        console.log(`[REWARD] ${user} can now claimReward()\n`);
      } catch (err) {
        console.error(`[ERROR] Failed to complete quest for ${user}:`, err.message);
      }
    }
  });

  // --- Also poll historical events (for catchup) ---
  console.log('Scanning recent swap events (last 1000 blocks)...');
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 1000;

  try {
    const filter = router.filters.Swap();
    const events = await router.queryFilter(filter, fromBlock, currentBlock);
    console.log(`Found ${events.length} recent swaps`);

    for (const event of events) {
      const user = event.args.sender;
      const alreadyCompleted = await quest.completions(user);
      if (alreadyCompleted) continue;

      const current = swapCounts.get(user) || 0;
      swapCounts.set(user, current + 1);
    }

    // Log summary
    console.log('\n--- Swap Summary ---');
    for (const [user, count] of swapCounts.entries()) {
      console.log(`${user}: ${count} swaps`);
    }
  } catch (err) {
    console.log('Historical scan skipped (may need archive node):', err.message);
  }

  console.log('\nVerifier running. Press Ctrl+C to stop.\n');
}

main().catch(console.error);
