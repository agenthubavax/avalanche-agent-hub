// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @title Types - Shared type definitions for Avalanche Agent Hub
/// @notice Centralized types to avoid cross-contract type mismatches
library Types {
    enum TaskType { OnChain, Social, Custom }
    enum QuestStatus { Active, Completed, Expired }
    enum AgentType { Trader, Monitor, Portfolio, Custom }
    enum AgentStatus { Active, Paused, Stopped }

    /// @notice Maximum basis points (100%)
    uint256 public constant MAX_BPS = 10_000;
    /// @notice Avalanche C-Chain ID
    uint256 public constant AVALANCHE_CHAIN_ID = 43_114;
}
