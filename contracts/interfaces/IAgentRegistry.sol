// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @title IAgentRegistry - Agent configuration and tracking interface
/// @notice Manages AI agent registration, activity recording, and lifecycle
interface IAgentRegistry {
    /// @notice Agent functional types
    enum AgentType { Trader, Monitor, Portfolio, Custom }

    /// @notice Agent lifecycle states
    enum AgentStatus { Active, Paused, Stopped }

    /// @notice On-chain agent configuration — packed for gas efficiency
    struct AgentConfig {
        AgentType agentType;      // 1 slot (0-3)
        address wallet;           // 1 slot
        uint256 maxTradeSize;     // 1 slot
        uint256 stopLossBps;      // 1 slot (basis points, max 10000)
        uint256 maxDailyTransactions; // 1 slot
        AgentStatus status;       // 1 slot (0-2)
        address owner;            // 1 slot
        uint256 createdAt;        // 1 slot
        uint256 totalTransactions; // 1 slot
        uint256 lastActivity;     // 1 slot
        // allowedTokens stored in separate mapping for gas efficiency
    }

    event AgentRegistered(uint256 indexed agentId, address indexed owner, AgentType agentType);
    event AgentActivity(uint256 indexed agentId, uint256 transactionCount);
    event AgentStatusChanged(uint256 indexed agentId, AgentStatus newStatus);

    function registerAgent(
        AgentType agentType,
        address wallet,
        uint256 maxTradeSize,
        string[] calldata allowedTokens,
        uint256 stopLossBps,
        uint256 maxDailyTransactions
    ) external returns (uint256);

    function recordActivity(uint256 agentId, uint256 transactionCount) external;
    function pauseAgent(uint256 agentId) external;
    function unpauseAgent(uint256 agentId) external;
    function stopAgent(uint256 agentId) external;
    function getAgent(uint256 agentId) external view returns (AgentConfig memory);
    function getAgentsByOwner(address owner) external view returns (uint256[] memory);
    function getAllowedTokens(uint256 agentId) external view returns (string[] memory);
    function isTokenAllowed(uint256 agentId, string calldata token) external view returns (bool);
}
