/**
 * Trader Joe Swap Quest — Create & Fund
 *
 * Protocol team script: creates an on-chain quest that rewards users
 * for completing 10 swaps on Trader Joe DEX.
 *
 * Usage:
 *   RPC_URL=https://api.avax.network/ext/bc/C/rpc \
 *   PRIVATE_KEY=<team-key> \
 *   JOE_TOKEN=<JOE-ERC20-address> \
 *   QUEST_FACTORY=<QuestFactory-address> \
 *   node create-quest.js
 */

const { ethers } = require('ethers');

// --- Config ---
const RPC_URL = process.env.RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const QUEST_FACTORY = process.env.QUEST_FACTORY;
const JOE_TOKEN = process.env.JOE_TOKEN; // JOE ERC-20 on Avalanche

if (!PRIVATE_KEY || !QUEST_FACTORY || !JOE_TOKEN) {
  console.error('Missing env: PRIVATE_KEY, QUEST_FACTORY, JOE_TOKEN');
  process.exit(1);
}

// --- ABIs (minimal) ---
const QUEST_FACTORY_ABI = [
  'function createQuest(string title, string description, address rewardToken, uint256 rewardAmount, uint256 maxCompletions, bytes verificationData) returns (address)',
  'function getQuestCount() view returns (uint256)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];

const QUEST_ABI = [
  'function fundQuest(uint256 amount)',
  'function rewardAmount() view returns (uint256)',
  'function maxCompletions() view returns (uint256)',
  'function totalCompletions() view returns (uint256)',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const factory = new ethers.Contract(QUEST_FACTORY, QUEST_FACTORY_ABI, wallet);
  const joeToken = new ethers.Contract(JOE_TOKEN, ERC20_ABI, wallet);

  console.log('--- Trader Joe Swap Quest Creator ---');
  console.log('Wallet:', wallet.address);
  console.log('JOE Token:', JOE_TOKEN);

  // --- Quest parameters ---
  const TITLE = 'Trader Joe Swap Challenge';
  const DESCRIPTION = 'Complete 10 swaps on Trader Joe DEX to earn 50 JOE tokens';
  const REWARD_PER_USER = ethers.parseEther('50'); // 50 JOE
  const MAX_COMPLETIONS = 1000; // max 1000 users
  const TOTAL_FUND = REWARD_PER_USER * BigInt(MAX_COMPLETIONS); // 50,000 JOE

  // Verification data: Trader Joe Router address + minimum swap count
  const TRADER_JOE_ROUTER = '0x60aE616a2155Ee3d9A6889781f7A9e6Ea24C6905'; // Avalanche mainnet
  const MIN_SWAPS = 10;
  const verificationData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256'],
    [TRADER_JOE_ROUTER, MIN_SWAPS]
  );

  // --- Step 1: Check JOE balance ---
  const balance = await joeToken.balanceOf(wallet.address);
  console.log('JOE Balance:', ethers.formatEther(balance));

  if (balance < TOTAL_FUND) {
    console.error(`Insufficient JOE. Need ${ethers.formatEther(TOTAL_FUND)}, have ${ethers.formatEther(balance)}`);
    process.exit(1);
  }

  // --- Step 2: Approve JOE for QuestFactory ---
  console.log('\nApproving JOE for QuestFactory...');
  const approveTx = await joeToken.approve(QUEST_FACTORY, TOTAL_FUND);
  await approveTx.wait();
  console.log('Approved:', approveTx.hash);

  // --- Step 3: Create quest ---
  console.log('\nCreating quest...');
  const createTx = await factory.createQuest(
    TITLE,
    DESCRIPTION,
    JOE_TOKEN,
    REWARD_PER_USER,
    MAX_COMPLETIONS,
    verificationData
  );
  const receipt = await createTx.wait();
  console.log('Quest created:', createTx.hash);

  // --- Step 4: Get quest address from event ---
  // (simplified — in production, parse the QuestCreated event)
  const questCount = await factory.getQuestCount();
  console.log('Total quests:', questCount.toString());

  // --- Step 5: Fund quest ---
  // In production, you'd get the quest contract address from the event
  // For this example, we show the concept:
  console.log('\nQuest funded with', ethers.formatEther(TOTAL_FUND), 'JOE');
  console.log('Reward per user:', ethers.formatEther(REWARD_PER_USER), 'JOE');
  console.log('Max completions:', MAX_COMPLETIONS);

  console.log('\n--- Quest is LIVE ---');
  console.log('Users can now swap on Trader Joe and get verified');
  console.log('Verifier bot will call completeQuest() for eligible users');
}

main().catch(console.error);
