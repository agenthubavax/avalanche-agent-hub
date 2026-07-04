/**
 * Trader Joe Swap Quest — Claim Reward
 *
 * User script: claims JOE token reward after quest completion.
 *
 * Usage:
 *   RPC_URL=https://api.avax.network/ext/bc/C/rpc \
 *   PRIVATE_KEY=<user-key> \
 *   QUEST_ADDRESS=<deployed-quest-address> \
 *   node user-claim.js
 */

const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const QUEST_ADDRESS = process.env.QUEST_ADDRESS;

if (!PRIVATE_KEY || !QUEST_ADDRESS) {
  console.error('Missing env: PRIVATE_KEY, QUEST_ADDRESS');
  process.exit(1);
}

const QUEST_ABI = [
  'function claimReward() external',
  'function completions(address user) view returns (bool)',
  'function rewardAmount() view returns (uint256)',
  'function rewardToken() view returns (address)',
];

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function symbol() view returns (string)',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const user = new ethers.Wallet(PRIVATE_KEY, provider);
  const quest = new ethers.Contract(QUEST_ADDRESS, QUEST_ABI, user);

  console.log('--- Claim Quest Reward ---');
  console.log('User:', user.address);
  console.log('Quest:', QUEST_ADDRESS);

  // Check if completed
  const isCompleted = await quest.completions(user.address);
  if (!isCompleted) {
    console.error('Quest not yet completed for this address.');
    console.error('Complete the required swaps on Trader Joe first.');
    process.exit(1);
  }

  // Show reward info
  const rewardToken = await quest.rewardToken();
  const rewardAmount = await quest.rewardAmount();
  const token = new ethers.Contract(rewardToken, ERC20_ABI, user);
  const symbol = await token.symbol();

  console.log(`Reward: ${ethers.formatEther(rewardAmount)} ${symbol}`);

  // Check balance before
  const balBefore = await token.balanceOf(user.address);
  console.log(`${symbol} balance before: ${ethers.formatEther(balBefore)}`);

  // Claim
  console.log('\nClaiming reward...');
  const tx = await quest.claimReward();
  await tx.wait();
  console.log('Claimed! tx:', tx.hash);

  // Check balance after
  const balAfter = await token.balanceOf(user.address);
  console.log(`${symbol} balance after: ${ethers.formatEther(balAfter)}`);
  console.log(`Received: ${ethers.formatEther(balAfter - balBefore)} ${symbol}`);
}

main().catch(console.error);
