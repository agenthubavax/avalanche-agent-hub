// Core types for Avalanche Agent Hub

export interface HubConfig {
  network: 'mainnet' | 'testnet';
  rpcUrl?: string;
  apiKey?: string;
}

export interface Quest {
  id: string;
  title: string;
  chain: string;
  tasks: QuestTask[];
  rewards: QuestReward;
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
}

export interface QuestTask {
  type: 'on-chain' | 'social' | 'custom';
  platform?: string;
  action?: string;
  contract?: string;
  method?: string;
  count?: number;
  metadata?: Record<string, any>;
}

export interface QuestReward {
  token: string;
  amount: number;
  distribution: 'instant' | 'merkle' | 'claim';
}

export interface Agent {
  id: string;
  type: 'trader' | 'monitor' | 'portfolio' | 'custom';
  wallet: string;
  rules: AgentRules;
  status: 'active' | 'paused' | 'stopped';
  createdAt: Date;
}

export interface AgentRules {
  maxTradeSize?: string;
  allowedTokens?: string[];
  stopLoss?: string;
  takeProfit?: string;
  maxDailyTransactions?: number;
  [key: string]: any;
}

export interface Wallet {
  address: string;
  chain: string;
  balance?: string;
  encrypted?: boolean;
  metadata?: Record<string, any>;
}

export interface Portfolio {
  wallets: Wallet[];
  totalValue: string;
  chains: string[];
  lastUpdated: Date;
}
