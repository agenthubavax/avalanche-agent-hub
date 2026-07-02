// Main AgentHub class - entry point

import { HubConfig } from './types';
import { QuestSDK } from './quest';
import { AgentKit } from './agent';
import { WalletManager } from './wallet';

export class AgentHub {
  private config: HubConfig;
  public quest: QuestSDK;
  public agent: AgentKit;
  public wallet: WalletManager;

  constructor(config: HubConfig) {
    this.config = config;
    this.quest = new QuestSDK(config);
    this.agent = new AgentKit(config);
    this.wallet = new WalletManager(config);
  }

  static create(config: HubConfig): AgentHub {
    return new AgentHub(config);
  }

  getConfig(): HubConfig {
    return { ...this.config };
  }
}
