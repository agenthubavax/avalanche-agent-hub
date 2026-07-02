export const stats = [
  { label: 'Total Quests', value: '1,247', change: '+12%' },
  { label: 'Total Agents', value: '384', change: '+8%' },
  { label: 'Active Users', value: '12,891', change: '+23%' },
  { label: 'TVL', value: '$4.2M', change: '+15%' },
]

export const recentActivity = [
  { id: 1, action: 'Quest completed', detail: 'Bridge 100 AVAX → Ethereum', user: '0x1a2b...3c4d', time: '2 min ago' },
  { id: 2, action: 'Agent deployed', detail: 'Swap Agent v2.1', user: '0x5e6f...7g8h', time: '5 min ago' },
  { id: 3, action: 'Reward distributed', detail: '50 AVAX to 15 users', user: 'System', time: '12 min ago' },
  { id: 4, action: 'Quest created', detail: 'Stake 500 AVAX for 30 days', user: '0x9i0j...1k2l', time: '18 min ago' },
  { id: 5, action: 'Wallet imported', detail: '3 wallets added', user: '0x3m4n...5o6p', time: '25 min ago' },
]

export type QuestStatus = 'Active' | 'Completed' | 'Expired'

export interface Quest {
  id: number
  title: string
  tasks: number
  reward: string
  completions: number
  status: QuestStatus
}

export const quests: Quest[] = [
  { id: 1, title: 'Bridge AVAX to Ethereum', tasks: 5, reward: '50 AVAX', completions: 342, status: 'Active' },
  { id: 2, title: 'Swap on Trader Joe', tasks: 3, reward: '25 AVAX', completions: 891, status: 'Active' },
  { id: 3, title: 'Stake on Benqi', tasks: 4, reward: '100 AVAX', completions: 156, status: 'Active' },
  { id: 4, title: 'Mint Avalanche Name', tasks: 2, reward: '10 AVAX', completions: 2104, status: 'Completed' },
  { id: 5, title: 'Provide Liquidity', tasks: 6, reward: '200 AVAX', completions: 78, status: 'Active' },
  { id: 6, title: 'Governance Vote', tasks: 1, reward: '5 AVAX', completions: 4521, status: 'Completed' },
  { id: 7, title: 'Deploy Subnet', tasks: 8, reward: '500 AVAX', completions: 12, status: 'Expired' },
]

export type AgentStatus = 'Active' | 'Paused' | 'Stopped'

export interface Agent {
  id: number
  name: string
  type: string
  wallet: string
  status: AgentStatus
  transactions: number
}

export const agents: Agent[] = [
  { id: 1, name: 'SwapBot Alpha', type: 'Swap Agent', wallet: '0x1a2b3c4d5e6f7890', status: 'Active', transactions: 1247 },
  { id: 2, name: 'Bridge Runner', type: 'Bridge Agent', wallet: '0xabcdef1234567890', status: 'Active', transactions: 892 },
  { id: 3, name: 'Stake Master', type: 'Staking Agent', wallet: '0x9876543210fedcba', status: 'Paused', transactions: 456 },
  { id: 4, name: 'Quest Solver', type: 'Quest Agent', wallet: '0xdeadbeefcafebabe', status: 'Active', transactions: 2103 },
  { id: 5, name: 'Liquidity Bot', type: 'LP Agent', wallet: '0xface0123456789ab', status: 'Stopped', transactions: 67 },
  { id: 6, name: 'Governance Voter', type: 'Gov Agent', wallet: '0x0123456789abcdef', status: 'Active', transactions: 34 },
]
