import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployQuestFactoryFixture } from "./deploy.js";

// enum TaskType { OnChain, Social, Custom }
const TT = { OnChain: 0, Social: 1, Custom: 2 };
// enum QuestStatus { Active, Completed, Expired }
const QS = { Active: 0, Completed: 1, Expired: 2 };

function makeTasks(n = 2) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      taskType: TT.OnChain,
      platform: "twitter",
      action: "follow",
      contractAddress: ethers.ZeroAddress,
      method: "",
      count: 1n,
    });
  }
  return out;
}

describe("QuestFactory", () => {
  describe("Deployment + initialization", () => {
    it("initializes with owner and is not paused", async () => {
      const { questFactory, owner } = await loadFixture(deployQuestFactoryFixture);
      expect(await questFactory.owner()).to.eq(owner.address);
      expect(await questFactory.paused()).to.eq(false);
      expect(await questFactory.MAX_TASKS()).to.eq(50n);
    });

    it("rejects zero owner on init", async () => {
      const Factory = await ethers.getContractFactory("QuestFactory");
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
      const { questFactory, owner } = await loadFixture(deployQuestFactoryFixture);
      await expect(questFactory.initialize(owner.address)).to.be.revertedWithCustomError(
        questFactory,
        "InvalidInitialization",
      );
    });

    it("impl is uninitialized (no proxy bypass)", async () => {
      const Factory = await ethers.getContractFactory("QuestFactory");
      const impl = await Factory.deploy();
      await impl.waitForDeployment();
      await expect(impl.MAX_TASKS()).to.not.be.reverted;
    });
  });

  describe("createQuest", () => {
    it("creates a valid quest, emits QuestCreated, increments id", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      const tasks = makeTasks(2);
      await expect(questFactory.connect(creator).createQuest("Q1", "avalanche", tasks, rewardToken.target, REWARD_AMOUNT))
        .to.emit(questFactory, "QuestCreated")
        .withArgs(1n, creator.address, "Q1");
      const q = await questFactory.getQuest(1);
      expect(q.id).to.eq(1n);
      expect(q.title).to.eq("Q1");
      expect(q.chain).to.eq("avalanche");
      expect(q.creator).to.eq(creator.address);
      expect(q.rewardToken).to.eq(rewardToken.target);
      expect(q.rewardAmount).to.eq(REWARD_AMOUNT);
      expect(q.status).to.eq(QS.Active);
      expect(q.tasks.length).to.eq(2);
    });

    it("reverts on empty title", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      await expect(
        questFactory.connect(creator).createQuest("", "avalanche", makeTasks(1), rewardToken.target, REWARD_AMOUNT),
      ).to.be.revertedWithCustomError(questFactory, "EmptyTitle");
    });

    it("reverts on empty tasks", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      await expect(
        questFactory.connect(creator).createQuest("Q", "avalanche", [], rewardToken.target, REWARD_AMOUNT),
      ).to.be.revertedWithCustomError(questFactory, "EmptyTasks");
    });

    it("reverts when too many tasks (>MAX_TASKS)", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      await expect(
        questFactory.connect(creator).createQuest("Q", "avalanche", makeTasks(51), rewardToken.target, REWARD_AMOUNT),
      ).to.be.revertedWithCustomError(questFactory, "TooManyTasks");
    });

    it("accepts exactly MAX_TASKS tasks", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      await expect(
        questFactory.connect(creator).createQuest("Q", "avalanche", makeTasks(50), rewardToken.target, REWARD_AMOUNT),
      ).to.emit(questFactory, "QuestCreated");
      expect((await questFactory.getQuest(1)).tasks.length).to.eq(50);
    });

    it("reverts on zero reward token", async () => {
      const { questFactory, creator, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      await expect(
        questFactory.connect(creator).createQuest("Q", "avalanche", makeTasks(1), ethers.ZeroAddress, REWARD_AMOUNT),
      ).to.be.revertedWithCustomError(questFactory, "ZeroAddress");
    });

    it("records quest under creator", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      await questFactory.connect(creator).createQuest("Q1", "c", makeTasks(1), rewardToken.target, REWARD_AMOUNT);
      await questFactory.connect(creator).createQuest("Q2", "c", makeTasks(1), rewardToken.target, REWARD_AMOUNT);
      expect(await questFactory.getQuestsByCreator(creator.address)).to.deep.eq([1n, 2n]);
    });
  });

  describe("fundQuest", () => {
    async function questFixture() {
      const f = await loadFixture(deployQuestFactoryFixture);
      await f.questFactory
        .connect(f.creator)
        .createQuest("Q", "avalanche", makeTasks(1), f.rewardToken.target, f.REWARD_AMOUNT);
      // approve
      await f.rewardToken.connect(f.creator).approve(f.questFactory.target, f.FUND_AMOUNT);
      return f;
    }

    it("funds quest, emits QuestFunded, accumulates amount", async () => {
      const { questFactory, creator, rewardToken, FUND_AMOUNT } = await questFixture();
      await expect(questFactory.connect(creator).fundQuest(1, FUND_AMOUNT))
        .to.emit(questFactory, "QuestFunded")
        .withArgs(1n, creator.address, FUND_AMOUNT);
      expect(await questFactory.getFundedAmount(1)).to.eq(FUND_AMOUNT);
      expect(await rewardToken.balanceOf(questFactory.target)).to.eq(FUND_AMOUNT);
    });

    it("accumulates multiple fundings", async () => {
      const { questFactory, creator } = await questFixture();
      await questFactory.connect(creator).fundQuest(1, 100n);
      await questFactory.connect(creator).fundQuest(1, 200n);
      expect(await questFactory.getFundedAmount(1)).to.eq(300n);
    });

    it("reverts when non-creator funds", async () => {
      const { questFactory, userA, FUND_AMOUNT } = await questFixture();
      await expect(questFactory.connect(userA).fundQuest(1, FUND_AMOUNT)).to.be.revertedWithCustomError(
        questFactory,
        "OnlyQuestCreator",
      );
    });

    it("reverts on zero amount", async () => {
      const { questFactory, creator } = await questFixture();
      await expect(questFactory.connect(creator).fundQuest(1, 0)).to.be.revertedWithCustomError(
        questFactory,
        "InsufficientBalance",
      );
    });

    it("reverts on non-existent quest", async () => {
      const { questFactory, creator, FUND_AMOUNT } = await questFixture();
      await expect(questFactory.connect(creator).fundQuest(999, FUND_AMOUNT)).to.be.revertedWithCustomError(
        questFactory,
        "QuestNotFound",
      );
    });
  });

  describe("completeTask", () => {
    async function questFixture() {
      const f = await loadFixture(deployQuestFactoryFixture);
      await f.questFactory
        .connect(f.creator)
        .createQuest("Q", "avalanche", makeTasks(2), f.rewardToken.target, f.REWARD_AMOUNT);
      await f.rewardToken.connect(f.creator).approve(f.questFactory.target, f.FUND_AMOUNT);
      await f.questFactory.connect(f.creator).fundQuest(1, f.FUND_AMOUNT);
      return f;
    }

    it("completes a valid task, emits TaskCompleted", async () => {
      const { questFactory, userA } = await questFixture();
      await expect(questFactory.connect(userA).completeTask(1, 0))
        .to.emit(questFactory, "TaskCompleted")
        .withArgs(1n, userA.address, 0n);
      const done = await questFactory.getCompletedTasks(1, userA.address);
      expect(done).to.deep.eq([0n]);
    });

    it("emits QuestCompleted when all tasks done (per-user)", async () => {
      const { questFactory, userA } = await questFixture();
      await questFactory.connect(userA).completeTask(1, 0);
      await expect(questFactory.connect(userA).completeTask(1, 1))
        .to.emit(questFactory, "QuestCompleted")
        .withArgs(1n, userA.address);
      expect(await questFactory.isQuestCompleted(1, userA.address)).to.eq(true);
    });

    it("does not mark quest globally Completed status", async () => {
      const { questFactory, userA } = await questFixture();
      await questFactory.connect(userA).completeTask(1, 0);
      await questFactory.connect(userA).completeTask(1, 1);
      const q = await questFactory.getQuest(1);
      expect(q.status).to.eq(QS.Active); // global stays Active
    });

    it("reverts on non-existent quest", async () => {
      const { questFactory, userA } = await questFixture();
      await expect(questFactory.connect(userA).completeTask(999, 0)).to.be.revertedWithCustomError(
        questFactory,
        "QuestNotFound",
      );
    });

    it("reverts on invalid task index", async () => {
      const { questFactory, userA } = await questFixture();
      await expect(questFactory.connect(userA).completeTask(1, 2)).to.be.revertedWithCustomError(
        questFactory,
        "InvalidTaskIndex",
      );
    });

    it("reverts on double completion of same task", async () => {
      const { questFactory, userA } = await questFixture();
      await questFactory.connect(userA).completeTask(1, 0);
      await expect(questFactory.connect(userA).completeTask(1, 0)).to.be.revertedWithCustomError(
        questFactory,
        "TaskAlreadyCompleted",
      );
    });
  });

  describe("claimReward", () => {
    async function questFixture() {
      const f = await loadFixture(deployQuestFactoryFixture);
      await f.questFactory
        .connect(f.creator)
        .createQuest("Q", "avalanche", makeTasks(2), f.rewardToken.target, f.REWARD_AMOUNT);
      await f.rewardToken.connect(f.creator).approve(f.questFactory.target, f.FUND_AMOUNT);
      await f.questFactory.connect(f.creator).fundQuest(1, f.FUND_AMOUNT);
      return f;
    }

    it("claims reward after completing all tasks, emits RewardClaimed", async () => {
      const { questFactory, rewardToken, userA, REWARD_AMOUNT } = await questFixture();
      await questFactory.connect(userA).completeTask(1, 0);
      await questFactory.connect(userA).completeTask(1, 1);
      await expect(questFactory.connect(userA).claimReward(1))
        .to.emit(questFactory, "RewardClaimed")
        .withArgs(1n, userA.address, REWARD_AMOUNT);
      expect(await rewardToken.balanceOf(userA.address)).to.eq(REWARD_AMOUNT);
    });

    it("reverts when quest not completed by user", async () => {
      const { questFactory, userA } = await questFixture();
      await questFactory.connect(userA).completeTask(1, 0); // only 1 of 2
      await expect(questFactory.connect(userA).claimReward(1)).to.be.revertedWithCustomError(
        questFactory,
        "QuestNotCompleted",
      );
    });

    it("reverts on double claim", async () => {
      const { questFactory, userA } = await questFixture();
      await questFactory.connect(userA).completeTask(1, 0);
      await questFactory.connect(userA).completeTask(1, 1);
      await questFactory.connect(userA).claimReward(1);
      await expect(questFactory.connect(userA).claimReward(1)).to.be.revertedWithCustomError(
        questFactory,
        "RewardAlreadyClaimed",
      );
    });

    it("reverts on non-existent quest", async () => {
      const { questFactory, userA } = await questFixture();
      await expect(questFactory.connect(userA).claimReward(999)).to.be.revertedWithCustomError(
        questFactory,
        "QuestNotFound",
      );
    });

    it("reverts with insufficient balance (unfunded quest)", async () => {
      const f = await loadFixture(deployQuestFactoryFixture);
      // create quest but do NOT fund
      await f.questFactory
        .connect(f.creator)
        .createQuest("Q", "avalanche", makeTasks(1), f.rewardToken.target, f.REWARD_AMOUNT);
      await f.questFactory.connect(f.userA).completeTask(1, 0);
      await expect(f.questFactory.connect(f.userA).claimReward(1)).to.be.revertedWithCustomError(
        f.questFactory,
        "InsufficientBalance",
      );
    });
  });

  describe("View functions", () => {
    it("getQuest reverts for non-existent", async () => {
      const { questFactory } = await loadFixture(deployQuestFactoryFixture);
      await expect(questFactory.getQuest(1)).to.be.revertedWithCustomError(questFactory, "QuestNotFound");
    });

    it("getCompletedTasks returns empty for no completions", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT, userA } = await loadFixture(
        deployQuestFactoryFixture,
      );
      await questFactory.connect(creator).createQuest("Q", "c", makeTasks(2), rewardToken.target, REWARD_AMOUNT);
      expect(await questFactory.getCompletedTasks(1, userA.address)).to.deep.eq([]);
    });

    it("getQuestsByCreator returns empty for non-creator", async () => {
      const { questFactory, userA } = await loadFixture(deployQuestFactoryFixture);
      expect(await questFactory.getQuestsByCreator(userA.address)).to.deep.eq([]);
    });

    it("getFundedAmount returns 0 for unfunded", async () => {
      const { questFactory, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(deployQuestFactoryFixture);
      await questFactory.connect(creator).createQuest("Q", "c", makeTasks(1), rewardToken.target, REWARD_AMOUNT);
      expect(await questFactory.getFundedAmount(1)).to.eq(0n);
    });

    it("isQuestCompleted returns false for unknown", async () => {
      const { questFactory, userA } = await loadFixture(deployQuestFactoryFixture);
      expect(await questFactory.isQuestCompleted(999, userA.address)).to.eq(false);
    });
  });

  describe("pause / unpause (onlyOwner)", () => {
    it("owner can pause and unpause", async () => {
      const { questFactory, owner } = await loadFixture(deployQuestFactoryFixture);
      await questFactory.connect(owner).pause();
      expect(await questFactory.paused()).to.eq(true);
      await questFactory.connect(owner).unpause();
      expect(await questFactory.paused()).to.eq(false);
    });

    it("non-owner cannot pause", async () => {
      const { questFactory, userA } = await loadFixture(deployQuestFactoryFixture);
      await expect(questFactory.connect(userA).pause()).to.be.revertedWithCustomError(
        questFactory,
        "OwnableUnauthorizedAccount",
      );
    });

    it("non-owner cannot unpause", async () => {
      const { questFactory, owner, userA } = await loadFixture(deployQuestFactoryFixture);
      await questFactory.connect(owner).pause();
      await expect(questFactory.connect(userA).unpause()).to.be.revertedWithCustomError(
        questFactory,
        "OwnableUnauthorizedAccount",
      );
    });

    it("paused contract blocks createQuest", async () => {
      const { questFactory, owner, creator, rewardToken, REWARD_AMOUNT } = await loadFixture(
        deployQuestFactoryFixture,
      );
      await questFactory.connect(owner).pause();
      await expect(
        questFactory.connect(creator).createQuest("Q", "c", makeTasks(1), rewardToken.target, REWARD_AMOUNT),
      ).to.be.revertedWithCustomError(questFactory, "EnforcedPause");
    });

    it("paused contract blocks completeTask and claimReward", async () => {
      const f = await loadFixture(deployQuestFactoryFixture);
      await f.questFactory
        .connect(f.creator)
        .createQuest("Q", "avalanche", makeTasks(1), f.rewardToken.target, f.REWARD_AMOUNT);
      await f.rewardToken.connect(f.creator).approve(f.questFactory.target, f.FUND_AMOUNT);
      await f.questFactory.connect(f.creator).fundQuest(1, f.FUND_AMOUNT);
      await f.questFactory.connect(f.userA).completeTask(1, 0);

      await f.questFactory.connect(f.owner).pause();
      await expect(f.questFactory.connect(f.userA).completeTask(1, 0)).to.be.revertedWithCustomError(
        f.questFactory,
        "EnforcedPause",
      );
      await expect(f.questFactory.connect(f.userA).claimReward(1)).to.be.revertedWithCustomError(
        f.questFactory,
        "EnforcedPause",
      );
    });
  });

  describe("Multi-user scenario", () => {
    it("User A and User B complete independently and both claim", async () => {
      const f = await loadFixture(deployQuestFactoryFixture);
      await f.questFactory
        .connect(f.creator)
        .createQuest("Q", "avalanche", makeTasks(2), f.rewardToken.target, f.REWARD_AMOUNT);
      await f.rewardToken.connect(f.creator).approve(f.questFactory.target, f.FUND_AMOUNT);
      await f.questFactory.connect(f.creator).fundQuest(1, f.FUND_AMOUNT);

      // User A completes both
      await f.questFactory.connect(f.userA).completeTask(1, 0);
      await f.questFactory.connect(f.userA).completeTask(1, 1);
      expect(await f.questFactory.isQuestCompleted(1, f.userA.address)).to.eq(true);
      expect(await f.questFactory.isQuestCompleted(1, f.userB.address)).to.eq(false);

      // User B completes both independently
      await f.questFactory.connect(f.userB).completeTask(1, 0);
      await f.questFactory.connect(f.userB).completeTask(1, 1);
      expect(await f.questFactory.isQuestCompleted(1, f.userB.address)).to.eq(true);

      // Both claim
      await f.questFactory.connect(f.userA).claimReward(1);
      await f.questFactory.connect(f.userB).claimReward(1);
      expect(await f.rewardToken.balanceOf(f.userA.address)).to.eq(f.REWARD_AMOUNT);
      expect(await f.rewardToken.balanceOf(f.userB.address)).to.eq(f.REWARD_AMOUNT);
    });

    it("user A completing does not affect user B's task state", async () => {
      const f = await loadFixture(deployQuestFactoryFixture);
      await f.questFactory
        .connect(f.creator)
        .createQuest("Q", "avalanche", makeTasks(2), f.rewardToken.target, f.REWARD_AMOUNT);
      await f.rewardToken.connect(f.creator).approve(f.questFactory.target, f.FUND_AMOUNT);
      await f.questFactory.connect(f.creator).fundQuest(1, f.FUND_AMOUNT);

      await f.questFactory.connect(f.userA).completeTask(1, 0);
      expect(await f.questFactory.getCompletedTasks(1, f.userA.address)).to.deep.eq([0n]);
      expect(await f.questFactory.getCompletedTasks(1, f.userB.address)).to.deep.eq([]);
    });
  });

  describe("Upgradeability (UUPS)", () => {
    it("owner can upgrade, non-owner cannot", async () => {
      const { questFactory, owner, userA } = await loadFixture(deployQuestFactoryFixture);
      const Factory = await ethers.getContractFactory("QuestFactory");
      const impl2 = await Factory.deploy();
      await impl2.waitForDeployment();
      await expect(questFactory.connect(owner).upgradeToAndCall(await impl2.getAddress(), "0x")).to.emit(
        questFactory,
        "Upgraded",
      );
      // non-owner
      const impl3 = await Factory.deploy();
      await impl3.waitForDeployment();
      await expect(questFactory.connect(userA).upgradeToAndCall(await impl3.getAddress(), "0x")).to.be.revertedWithCustomError(
        questFactory,
        "OwnableUnauthorizedAccount",
      );
    });
  });
});
