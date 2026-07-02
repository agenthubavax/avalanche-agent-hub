// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./interfaces/IAgentRegistry.sol";
import "./libraries/Types.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title AgentRegistry - AI agent lifecycle management on Avalanche C-Chain
/// @notice UUPS-upgradeable agent registry with activity tracking
/// @dev Gas-optimized: allowedTokens in separate mapping, struct packing
contract AgentRegistry is
    IAgentRegistry,
    OwnableUpgradeable,
    ReentrancyGuard,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // --- Custom Errors ---
    error ZeroAddress();
    error AgentNotFound();
    error AgentNotActive();
    error AgentAlreadyStopped();
    error OnlyAgentOwner();
    error InvalidStopLoss();
    error InvalidMaxTradeSize();

    // --- Storage ---
    mapping(uint256 => AgentConfig) private _agents;
    mapping(uint256 => string[]) private _allowedTokens;
    mapping(uint256 => mapping(string => bool)) private _tokenLookup;
    mapping(address => uint256[]) private _agentsByOwner;
    uint256 private _agentCounter;

    // --- Initializer ---
    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        __Ownable_init(initialOwner);
        __Pausable_init();
    }

    /// @notice Register a new AI agent
    /// @param agentType Functional type of the agent
    /// @param wallet Agent's operational wallet address
    /// @param maxTradeSize Maximum single trade size
    /// @param allowedTokens Whitelisted token symbols
    /// @param stopLossBps Stop-loss in basis points (max 10000)
    /// @param maxDailyTransactions Daily transaction cap
    /// @return agentId The newly registered agent ID
    function registerAgent(
        AgentType agentType,
        address wallet,
        uint256 maxTradeSize,
        string[] calldata allowedTokens,
        uint256 stopLossBps,
        uint256 maxDailyTransactions
    ) external whenNotPaused returns (uint256) {
        if (wallet == address(0)) revert ZeroAddress();
        if (stopLossBps > Types.MAX_BPS) revert InvalidStopLoss();
        if (maxTradeSize == 0) revert InvalidMaxTradeSize();

        uint256 agentId = ++_agentCounter;

        AgentConfig storage config = _agents[agentId];
        config.agentType = agentType;
        config.wallet = wallet;
        config.maxTradeSize = maxTradeSize;
        config.stopLossBps = stopLossBps;
        config.maxDailyTransactions = maxDailyTransactions;
        config.status = AgentStatus.Active;
        config.owner = msg.sender;
        config.createdAt = block.timestamp;

        // Store allowed tokens — separate mapping for gas-efficient iteration
        for (uint256 i; i < allowedTokens.length; ++i) {
            _allowedTokens[agentId].push(allowedTokens[i]);
            _tokenLookup[agentId][allowedTokens[i]] = true;
        }

        _agentsByOwner[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, agentType);
        return agentId;
    }

    /// @notice Record agent activity (transaction count update)
    /// @dev Only callable by agent wallet or owner
    /// @param agentId Agent identifier
    /// @param transactionCount Number of transactions to record
    function recordActivity(uint256 agentId, uint256 transactionCount) external whenNotPaused {
        AgentConfig storage config = _agents[agentId];
        if (config.wallet == address(0)) revert AgentNotFound();
        if (msg.sender != config.owner && msg.sender != config.wallet) revert OnlyAgentOwner();

        // Effects before interactions (no external calls here, but pattern-consistent)
        config.totalTransactions += transactionCount;
        config.lastActivity = block.timestamp;

        emit AgentActivity(agentId, transactionCount);
    }

    /// @notice Pause an agent (owner only)
    /// @param agentId Agent identifier
    function pauseAgent(uint256 agentId) external onlyOwner {
        AgentConfig storage config = _agents[agentId];
        if (config.wallet == address(0)) revert AgentNotFound();
        if (config.status != AgentStatus.Active) revert AgentNotActive();

        config.status = AgentStatus.Paused;
        emit AgentStatusChanged(agentId, AgentStatus.Paused);
    }

    /// @notice Unpause a paused agent (owner only)
    /// @param agentId Agent identifier
    function unpauseAgent(uint256 agentId) external onlyOwner {
        AgentConfig storage config = _agents[agentId];
        if (config.wallet == address(0)) revert AgentNotFound();
        if (config.status != AgentStatus.Paused) revert AgentNotActive();

        config.status = AgentStatus.Active;
        emit AgentStatusChanged(agentId, AgentStatus.Active);
    }

    /// @notice Permanently stop an agent (owner only)
    /// @param agentId Agent identifier
    function stopAgent(uint256 agentId) external onlyOwner {
        AgentConfig storage config = _agents[agentId];
        if (config.wallet == address(0)) revert AgentNotFound();
        if (config.status == AgentStatus.Stopped) revert AgentAlreadyStopped();

        config.status = AgentStatus.Stopped;
        emit AgentStatusChanged(agentId, AgentStatus.Stopped);
    }

    /// @notice Get agent configuration
    /// @param agentId Agent identifier
    /// @return AgentConfig data
    function getAgent(uint256 agentId) external view returns (AgentConfig memory) {
        if (_agents[agentId].wallet == address(0)) revert AgentNotFound();
        return _agents[agentId];
    }

    /// @notice Get all agent IDs owned by an address
    /// @param owner Owner address
    /// @return Array of agent IDs
    function getAgentsByOwner(address owner) external view returns (uint256[] memory) {
        return _agentsByOwner[owner];
    }

    /// @notice Get allowed token list for an agent
    /// @param agentId Agent identifier
    /// @return Array of allowed token symbols
    function getAllowedTokens(uint256 agentId) external view returns (string[] memory) {
        return _allowedTokens[agentId];
    }

    /// @notice Check if a token is allowed for an agent
    /// @param agentId Agent identifier
    /// @param token Token symbol
    /// @return true if token is whitelisted
    function isTokenAllowed(uint256 agentId, string calldata token) external view returns (bool) {
        return _tokenLookup[agentId][token];
    }

    /// @notice Pause all registry operations (emergency)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause registry operations
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice UUPS upgrade authorization
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
