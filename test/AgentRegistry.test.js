import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployAgentRegistryFixture } from "./deploy.js";

// enum AgentType { Trader, Monitor, Portfolio, Custom }
const AT = { Trader: 0, Monitor: 1, Portfolio: 2, Custom: 3 };
// enum AgentStatus { Active, Paused, Stopped }
const AS = { Active: 0, Paused: 1, Stopped: 2 };

const VALID_WALLET = "0x0000000000000000000000000000000000001111";
const MAX_TOKENS = 100;
const MAX_TX_COUNT = 1000;

function uniqueTokens(n) {
  return Array.from({ length: n }, (_, i) => `TKN${i}`);
}

describe("AgentRegistry", () => {
  describe("Deployment + initialization", () => {
    it("initializes with owner and is not paused", async () => {
      const { agentRegistry, owner } = await loadFixture(deployAgentRegistryFixture);
      expect(await agentRegistry.owner()).to.eq(owner.address);
      expect(await agentRegistry.paused()).to.eq(false);
      expect(await agentRegistry.MAX_TOKENS()).to.eq(100n);
      expect(await agentRegistry.MAX_TRANSACTION_COUNT()).to.eq(1000n);
    });

    it("rejects zero owner on init", async () => {
      const Factory = await ethers.getContractFactory("AgentRegistry");
      const impl = await Factory.deploy();
      await impl.waitForDeployment();
      const initData = Factory.interface.encodeFunctionData("initialize", [ethers.ZeroAddress]);
      const ERC1967 = await ethers.getContractFactory("ERC1967Proxy");
      await expect(ERC1967.deploy(await impl.getAddress(), initData)).to.be.revertedWithCustomError(
        impl,
        "ZeroAddress",
      );
    });

    it("prevents re-initialization", async () => {
      const { agentRegistry, owner } = await loadFixture(deployAgentRegistryFixture);
      await expect(agentRegistry.initialize(owner.address)).to.be.revertedWithCustomError(
        agentRegistry,
        "InvalidInitialization",
      );
    });
  });

  describe("registerAgent", () => {
    async function reg(args = {}) {
      const f = await loadFixture(deployAgentRegistryFixture);
      const agentOwner = args.agentOwner ?? f.agentOwner;
      const wallet = args.wallet ?? VALID_WALLET;
      const maxTradeSize = args.maxTradeSize ?? 1000n;
      const tokens = args.tokens ?? ["WAVAX", "USDC"];
      const stopLossBps = args.stopLossBps ?? 500n;
      const maxDailyTx = args.maxDailyTx ?? 100n;
      return { ...f, agentOwner, tx: f.agentRegistry.connect(agentOwner).registerAgent(
        AT.Trader, wallet, maxTradeSize, tokens, stopLossBps, maxDailyTx,
      ) };
    }

    it("registers a valid agent, emits AgentRegistered, returns id", async () => {
      const { agentRegistry, agentOwner } = await reg();
      await expect((await reg()).tx).to.emit(agentRegistry, "AgentRegistered");
      // do explicit to check args
      const f = await loadFixture(deployAgentRegistryFixture);
      await expect(f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX"], 500n, 100n))
        .to.emit(f.agentRegistry, "AgentRegistered")
        .withArgs(1n, f.agentOwner.address, AT.Trader);
      const a = await f.agentRegistry.getAgent(1);
      expect(a.wallet).to.eq(VALID_WALLET);
    });

    it("stores config correctly", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX", "USDC"], 500n, 100n);
      const a = await f.agentRegistry.getAgent(1);
      expect(a.wallet).to.eq(VALID_WALLET);
      expect(a.agentType).to.eq(AT.Trader);
      expect(a.maxTradeSize).to.eq(1000n);
      expect(a.stopLossBps).to.eq(500n);
      expect(a.maxDailyTransactions).to.eq(100n);
      expect(a.status).to.eq(AS.Active);
      expect(a.owner).to.eq(f.agentOwner.address);
      expect(a.totalTransactions).to.eq(0n);
    });

    it("reverts on zero wallet", async () => {
      const { agentRegistry, agentOwner } = await reg({ wallet: ethers.ZeroAddress });
      await expect(agentRegistry.connect(agentOwner).registerAgent(AT.Trader, ethers.ZeroAddress, 1000n, ["WAVAX"], 500n, 100n))
        .to.be.revertedWithCustomError(agentRegistry, "ZeroAddress");
    });

    it("reverts on invalid stop loss (>MAX_BPS)", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await expect(
        f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX"], 10_001n, 100n),
      ).to.be.revertedWithCustomError(f.agentRegistry, "InvalidStopLoss");
    });

    it("accepts stop loss == MAX_BPS (10000)", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await expect(
        f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX"], 10_000n, 100n),
      ).to.emit(f.agentRegistry, "AgentRegistered");
    });

    it("reverts on zero max trade size", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await expect(
        f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Trader, VALID_WALLET, 0n, ["WAVAX"], 500n, 100n),
      ).to.be.revertedWithCustomError(f.agentRegistry, "InvalidMaxTradeSize");
    });

    it("reverts on too many tokens (>MAX_TOKENS)", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await expect(
        f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Trader, VALID_WALLET, 1000n, uniqueTokens(101), 500n, 100n),
      ).to.be.revertedWithCustomError(f.agentRegistry, "TooManyTokens");
    });

    it("accepts exactly MAX_TOKENS tokens", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await expect(
        f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Trader, VALID_WALLET, 1000n, uniqueTokens(100), 500n, 100n),
      ).to.emit(f.agentRegistry, "AgentRegistered");
      expect(await f.agentRegistry.getAllowedTokens(1)).to.have.length(100);
    });

    it("skips duplicate tokens (dedup)", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX", "WAVAX", "USDC", "USDC"], 500n, 100n);
      const tokens = await f.agentRegistry.getAllowedTokens(1);
      expect(tokens).to.deep.eq(["WAVAX", "USDC"]);
    });

    it("records agent under owner", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX"], 500n, 100n);
      await f.agentRegistry.connect(f.agentOwner).registerAgent(AT.Monitor, VALID_WALLET, 500n, ["USDC"], 0n, 50n);
      expect(await f.agentRegistry.getAgentsByOwner(f.agentOwner.address)).to.deep.eq([1n, 2n]);
    });
  });

  describe("recordActivity", () => {
    async function regFixture() {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, f.agentWallet.address, 1000n, ["WAVAX"], 500n, 100n);
      return f;
    }

    it("records valid activity by owner, emits AgentActivity", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).recordActivity(1, 10))
        .to.emit(agentRegistry, "AgentActivity")
        .withArgs(1n, 10n);
      const a = await agentRegistry.getAgent(1);
      expect(a.totalTransactions).to.eq(10n);
      expect(a.lastActivity).to.gt(0n);
    });

    it("records valid activity by agent wallet", async () => {
      const { agentRegistry, agentWallet } = await regFixture();
      await expect(agentRegistry.connect(agentWallet).recordActivity(1, 5))
        .to.emit(agentRegistry, "AgentActivity")
        .withArgs(1n, 5n);
      const a = await agentRegistry.getAgent(1);
      expect(a.totalTransactions).to.eq(5n);
    });

    it("accumulates totalTransactions across calls", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await agentRegistry.connect(agentOwner).recordActivity(1, 10);
      await agentRegistry.connect(agentOwner).recordActivity(1, 20);
      const a = await agentRegistry.getAgent(1);
      expect(a.totalTransactions).to.eq(30n);
    });

    it("reverts when called by non-owner/non-wallet", async () => {
      const { agentRegistry, other } = await regFixture();
      await expect(agentRegistry.connect(other).recordActivity(1, 10)).to.be.revertedWithCustomError(
        agentRegistry,
        "OnlyAgentOwner",
      );
    });

    it("reverts on zero count", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).recordActivity(1, 0)).to.be.revertedWithCustomError(
        agentRegistry,
        "InvalidTransactionCount",
      );
    });

    it("reverts when count exceeds MAX", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).recordActivity(1, MAX_TX_COUNT + 1)).to.be.revertedWithCustomError(
        agentRegistry,
        "InvalidTransactionCount",
      );
    });

    it("accepts count == MAX", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).recordActivity(1, MAX_TX_COUNT)).to.emit(
        agentRegistry,
        "AgentActivity",
      );
    });

    it("reverts on non-existent agent", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).recordActivity(999, 10)).to.be.revertedWithCustomError(
        agentRegistry,
        "AgentNotFound",
      );
    });
  });

  describe("pauseAgent / unpauseAgent", () => {
    async function regFixture() {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, f.agentWallet.address, 1000n, ["WAVAX"], 500n, 100n);
      return f;
    }

    it("agent owner can pause, emits AgentStatusChanged", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).pauseAgent(1))
        .to.emit(agentRegistry, "AgentStatusChanged")
        .withArgs(1n, AS.Paused);
      expect((await agentRegistry.getAgent(1)).status).to.eq(AS.Paused);
    });

    it("contract owner can pause", async () => {
      const { agentRegistry, owner } = await regFixture();
      await agentRegistry.connect(owner).pauseAgent(1);
      expect((await agentRegistry.getAgent(1)).status).to.eq(AS.Paused);
    });

    it("agent owner can unpause", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await agentRegistry.connect(agentOwner).pauseAgent(1);
      await expect(agentRegistry.connect(agentOwner).unpauseAgent(1))
        .to.emit(agentRegistry, "AgentStatusChanged")
        .withArgs(1n, AS.Active);
      expect((await agentRegistry.getAgent(1)).status).to.eq(AS.Active);
    });

    it("contract owner can unpause", async () => {
      const { agentRegistry, owner, agentOwner } = await regFixture();
      await agentRegistry.connect(agentOwner).pauseAgent(1);
      await agentRegistry.connect(owner).unpauseAgent(1);
      expect((await agentRegistry.getAgent(1)).status).to.eq(AS.Active);
    });

    it("unauthorized cannot pause", async () => {
      const { agentRegistry, other } = await regFixture();
      await expect(agentRegistry.connect(other).pauseAgent(1)).to.be.revertedWithCustomError(
        agentRegistry,
        "OnlyAgentOwner",
      );
    });

    it("unauthorized cannot unpause", async () => {
      const { agentRegistry, other, agentOwner } = await regFixture();
      await agentRegistry.connect(agentOwner).pauseAgent(1);
      await expect(agentRegistry.connect(other).unpauseAgent(1)).to.be.revertedWithCustomError(
        agentRegistry,
        "OnlyAgentOwner",
      );
    });

    it("cannot pause non-active agent", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await agentRegistry.connect(agentOwner).pauseAgent(1);
      await expect(agentRegistry.connect(agentOwner).pauseAgent(1)).to.be.revertedWithCustomError(
        agentRegistry,
        "AgentNotActive",
      );
    });

    it("cannot unpause non-paused agent", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).unpauseAgent(1)).to.be.revertedWithCustomError(
        agentRegistry,
        "AgentNotActive",
      );
    });

    it("cannot pause stopped agent", async () => {
      const { agentRegistry, owner, agentOwner } = await regFixture();
      await agentRegistry.connect(owner).stopAgent(1);
      await expect(agentRegistry.connect(agentOwner).pauseAgent(1)).to.be.revertedWithCustomError(
        agentRegistry,
        "AgentNotActive",
      );
    });

    it("reverts on non-existent agent", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).pauseAgent(999)).to.be.revertedWithCustomError(
        agentRegistry,
        "AgentNotFound",
      );
    });
  });

  describe("stopAgent", () => {
    async function regFixture() {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, f.agentWallet.address, 1000n, ["WAVAX"], 500n, 100n);
      return f;
    }

    it("contract owner can stop, emits AgentStatusChanged", async () => {
      const { agentRegistry, owner } = await regFixture();
      await expect(agentRegistry.connect(owner).stopAgent(1))
        .to.emit(agentRegistry, "AgentStatusChanged")
        .withArgs(1n, AS.Stopped);
      expect((await agentRegistry.getAgent(1)).status).to.eq(AS.Stopped);
    });

    it("agent owner cannot stop", async () => {
      const { agentRegistry, agentOwner } = await regFixture();
      await expect(agentRegistry.connect(agentOwner).stopAgent(1)).to.be.revertedWithCustomError(
        agentRegistry,
        "OwnableUnauthorizedAccount",
      );
    });

    it("cannot stop already stopped agent", async () => {
      const { agentRegistry, owner } = await regFixture();
      await agentRegistry.connect(owner).stopAgent(1);
      await expect(agentRegistry.connect(owner).stopAgent(1)).to.be.revertedWithCustomError(
        agentRegistry,
        "AgentAlreadyStopped",
      );
    });

    it("can stop paused agent", async () => {
      const { agentRegistry, owner, agentOwner } = await regFixture();
      await agentRegistry.connect(agentOwner).pauseAgent(1);
      await agentRegistry.connect(owner).stopAgent(1);
      expect((await agentRegistry.getAgent(1)).status).to.eq(AS.Stopped);
    });

    it("reverts on non-existent agent", async () => {
      const { agentRegistry, owner } = await regFixture();
      await expect(agentRegistry.connect(owner).stopAgent(999)).to.be.revertedWithCustomError(
        agentRegistry,
        "AgentNotFound",
      );
    });
  });

  describe("View functions", () => {
    it("getAgent reverts for non-existent", async () => {
      const { agentRegistry } = await loadFixture(deployAgentRegistryFixture);
      await expect(agentRegistry.getAgent(1)).to.be.revertedWithCustomError(agentRegistry, "AgentNotFound");
    });

    it("getAgentsByOwner returns empty for non-owner", async () => {
      const { agentRegistry, other } = await loadFixture(deployAgentRegistryFixture);
      expect(await agentRegistry.getAgentsByOwner(other.address)).to.deep.eq([]);
    });

    it("getAllowedTokens returns stored tokens", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX", "USDC", "JOE"], 500n, 100n);
      expect(await f.agentRegistry.getAllowedTokens(1)).to.deep.eq(["WAVAX", "USDC", "JOE"]);
    });

    it("getAllowedTokens returns empty for non-existent agent", async () => {
      const { agentRegistry } = await loadFixture(deployAgentRegistryFixture);
      expect(await agentRegistry.getAllowedTokens(999)).to.deep.eq([]);
    });

    it("isTokenAllowed returns true/false correctly", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX", "USDC"], 500n, 100n);
      expect(await f.agentRegistry.isTokenAllowed(1, "WAVAX")).to.eq(true);
      expect(await f.agentRegistry.isTokenAllowed(1, "USDC")).to.eq(true);
      expect(await f.agentRegistry.isTokenAllowed(1, "UNKNOWN")).to.eq(false);
    });

    it("isTokenAllowed returns false for non-existent agent", async () => {
      const { agentRegistry } = await loadFixture(deployAgentRegistryFixture);
      expect(await agentRegistry.isTokenAllowed(999, "WAVAX")).to.eq(false);
    });
  });

  describe("pause / unpause (onlyOwner, contract-level)", () => {
    it("owner can pause and unpause contract", async () => {
      const { agentRegistry, owner } = await loadFixture(deployAgentRegistryFixture);
      await agentRegistry.connect(owner).pause();
      expect(await agentRegistry.paused()).to.eq(true);
      await agentRegistry.connect(owner).unpause();
      expect(await agentRegistry.paused()).to.eq(false);
    });

    it("non-owner cannot pause", async () => {
      const { agentRegistry, other } = await loadFixture(deployAgentRegistryFixture);
      await expect(agentRegistry.connect(other).pause()).to.be.revertedWithCustomError(
        agentRegistry,
        "OwnableUnauthorizedAccount",
      );
    });

    it("non-owner cannot unpause", async () => {
      const { agentRegistry, owner, other } = await loadFixture(deployAgentRegistryFixture);
      await agentRegistry.connect(owner).pause();
      await expect(agentRegistry.connect(other).unpause()).to.be.revertedWithCustomError(
        agentRegistry,
        "OwnableUnauthorizedAccount",
      );
    });

    it("paused contract blocks registerAgent", async () => {
      const { agentRegistry, owner, agentOwner } = await loadFixture(deployAgentRegistryFixture);
      await agentRegistry.connect(owner).pause();
      await expect(
        agentRegistry.connect(agentOwner).registerAgent(AT.Trader, VALID_WALLET, 1000n, ["WAVAX"], 500n, 100n),
      ).to.be.revertedWithCustomError(agentRegistry, "EnforcedPause");
    });

    it("paused contract blocks recordActivity", async () => {
      const f = await loadFixture(deployAgentRegistryFixture);
      await f.agentRegistry
        .connect(f.agentOwner)
        .registerAgent(AT.Trader, f.agentWallet.address, 1000n, ["WAVAX"], 500n, 100n);
      await f.agentRegistry.connect(f.owner).pause();
      await expect(f.agentRegistry.connect(f.agentOwner).recordActivity(1, 10)).to.be.revertedWithCustomError(
        f.agentRegistry,
        "EnforcedPause",
      );
    });
  });

  describe("Upgradeability (UUPS)", () => {
    it("owner can upgrade, non-owner cannot", async () => {
      const { agentRegistry, owner, other } = await loadFixture(deployAgentRegistryFixture);
      const Factory = await ethers.getContractFactory("AgentRegistry");
      const impl2 = await Factory.deploy();
      await impl2.waitForDeployment();
      await expect(agentRegistry.connect(owner).upgradeToAndCall(await impl2.getAddress(), "0x")).to.emit(
        agentRegistry,
        "Upgraded",
      );
      const impl3 = await Factory.deploy();
      await impl3.waitForDeployment();
      await expect(agentRegistry.connect(other).upgradeToAndCall(await impl3.getAddress(), "0x")).to.be.revertedWithCustomError(
        agentRegistry,
        "OwnableUnauthorizedAccount",
      );
    });
  });
});
