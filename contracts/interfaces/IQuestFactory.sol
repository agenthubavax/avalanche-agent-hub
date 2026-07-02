// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @title IQuestFactory - Quest management interface for Avalanche Agent Hub
/// @notice Defines quest creation, task completion, and reward claiming
interface IQuestFactory {
    /// @notice Task types supported by quests
    enum TaskType { OnChain, Social, Custom }

    /// @notice Quest lifecycle states
    enum QuestStatus { Active, Completed, Expired }

    /// @notice Represents a single task within a quest
    struct Task {
        TaskType taskType;
        string platform;
        string action;
        address contractAddress;
        string method;
        uint256 count;
    }

    /// @notice On-chain quest data
    struct Quest {
        uint256 id;
        string title;
        string chain;
        Task[] tasks;
        address rewardToken;
        uint256 rewardAmount;
        QuestStatus status;
        address creator;
        uint256 createdAt;
    }

    event QuestCreated(uint256 indexed questId, address indexed creator, string title);
    event TaskCompleted(uint256 indexed questId, address indexed wallet, uint256 taskIndex);
    event QuestCompleted(uint256 indexed questId, address indexed wallet);
    event RewardClaimed(uint256 indexed questId, address indexed wallet, uint256 amount);

    function createQuest(
        string calldata title,
        string calldata chain,
        Task[] calldata tasks,
        address rewardToken,
        uint256 rewardAmount
    ) external returns (uint256);

    function completeTask(uint256 questId, uint256 taskIndex) external;
    function claimReward(uint256 questId) external;
    function getQuest(uint256 questId) external view returns (Quest memory);
    function getQuestsByCreator(address creator) external view returns (uint256[] memory);
    function getCompletedTasks(uint256 questId, address wallet) external view returns (uint256[] memory);
}
