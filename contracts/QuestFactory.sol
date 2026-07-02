// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./interfaces/IQuestFactory.sol";
import "./libraries/Types.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title QuestFactory - On-chain quest creation and reward distribution
/// @notice UUPS-upgradeable quest system for Avalanche Agent Hub
/// @dev Checks-effects-interactions pattern; pull-over-push for rewards
contract QuestFactory is
    IQuestFactory,
    OwnableUpgradeable,
    ReentrancyGuard,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // --- Custom Errors ---
    error ZeroAddress();
    error EmptyTasks();
    error InvalidTaskIndex();
    error QuestNotFound();
    error QuestNotActive();
    error TaskAlreadyCompleted();
    error QuestNotCompleted();
    error RewardAlreadyClaimed();
    error InsufficientBalance();
    error OnlyQuestCreator();

    // --- Storage ---
    mapping(uint256 => Quest) private _quests;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) private _taskCompleted;
    mapping(uint256 => mapping(address => uint256)) private _completedTaskCount;
    mapping(uint256 => mapping(address => bool)) private _rewardClaimed;
    mapping(uint256 => uint256) private _totalTasks;
    mapping(address => uint256[]) private _questsByCreator;
    uint256 private _questCounter;

    // --- Initializer (replaces constructor for proxy) ---
    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        __Ownable_init(initialOwner);
        __Pausable_init();
    }

    /// @notice Create a new quest with tasks and reward configuration
    /// @param title Quest display title
    /// @param chain Target blockchain identifier
    /// @param tasks Array of quest tasks
    /// @param rewardToken ERC20 token used for rewards
    /// @param rewardAmount Reward per completion (in token decimals)
    /// @return questId The newly created quest ID
    function createQuest(
        string calldata title,
        string calldata chain,
        Task[] calldata tasks,
        address rewardToken,
        uint256 rewardAmount
    ) external whenNotPaused returns (uint256) {
        if (tasks.length == 0) revert EmptyTasks();
        if (rewardToken == address(0)) revert ZeroAddress();

        uint256 questId = ++_questCounter;

        // Store quest — calldata array copied to storage
        Quest storage q = _quests[questId];
        q.id = questId;
        q.title = title;
        q.chain = chain;
        q.rewardToken = rewardToken;
        q.rewardAmount = rewardAmount;
        q.status = QuestStatus.Active;
        q.creator = msg.sender;
        q.createdAt = block.timestamp;

        // Copy tasks to storage
        for (uint256 i; i < tasks.length; ++i) {
            q.tasks.push(Task({
                taskType: tasks[i].taskType,
                platform: tasks[i].platform,
                action: tasks[i].action,
                contractAddress: tasks[i].contractAddress,
                method: tasks[i].method,
                count: tasks[i].count
            }));
        }

        _totalTasks[questId] = tasks.length;
        _questsByCreator[msg.sender].push(questId);

        emit QuestCreated(questId, msg.sender, title);
        return questId;
    }

    /// @notice Mark a specific quest task as completed for the caller
    /// @param questId Quest identifier
    /// @param taskIndex Index within the quest's task array
    function completeTask(uint256 questId, uint256 taskIndex) external whenNotPaused {
        if (_quests[questId].id == 0) revert QuestNotFound();
        if (_quests[questId].status != QuestStatus.Active) revert QuestNotActive();
        if (taskIndex >= _totalTasks[questId]) revert InvalidTaskIndex();
        if (_taskCompleted[questId][msg.sender][taskIndex]) revert TaskAlreadyCompleted();

        // Effects before interactions
        _taskCompleted[questId][msg.sender][taskIndex] = true;
        _completedTaskCount[questId][msg.sender]++;

        // Check if all tasks completed → auto-complete quest
        if (_completedTaskCount[questId][msg.sender] == _totalTasks[questId]) {
            _quests[questId].status = QuestStatus.Completed;
            emit QuestCompleted(questId, msg.sender);
        }

        emit TaskCompleted(questId, msg.sender, taskIndex);
    }

    /// @notice Claim reward for a completed quest (pull pattern)
    /// @param questId Quest identifier
    function claimReward(uint256 questId) external nonReentrant whenNotPaused {
        Quest storage q = _quests[questId];
        if (q.id == 0) revert QuestNotFound();
        if (q.status != QuestStatus.Completed) revert QuestNotCompleted();
        if (_rewardClaimed[questId][msg.sender]) revert RewardAlreadyClaimed();

        // Effects before interactions
        _rewardClaimed[questId][msg.sender] = true;

        // Interaction: safe ERC20 transfer
        IERC20(q.rewardToken).safeTransfer(msg.sender, q.rewardAmount);

        emit RewardClaimed(questId, msg.sender, q.rewardAmount);
    }

    /// @notice Get quest details
    /// @param questId Quest identifier
    /// @return Quest data
    function getQuest(uint256 questId) external view returns (Quest memory) {
        if (_quests[questId].id == 0) revert QuestNotFound();
        return _quests[questId];
    }

    /// @notice Get all quest IDs created by an address
    /// @param creator Creator address
    /// @return Array of quest IDs
    function getQuestsByCreator(address creator) external view returns (uint256[] memory) {
        return _questsByCreator[creator];
    }

    /// @notice Get indices of completed tasks for a wallet on a quest
    /// @param questId Quest identifier
    /// @param wallet User address
    /// @return Array of completed task indices
    function getCompletedTasks(uint256 questId, address wallet) external view returns (uint256[] memory) {
        uint256 total = _totalTasks[questId];
        uint256 count = _completedTaskCount[questId][wallet];

        uint256[] memory completed = new uint256[](count);
        uint256 j;
        for (uint256 i; i < total; ++i) {
            if (_taskCompleted[questId][wallet][i]) {
                completed[j++] = i;
            }
        }
        return completed;
    }

    /// @notice Pause all quest operations (emergency)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause quest operations
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice UUPS upgrade authorization
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
