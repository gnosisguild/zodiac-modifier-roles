// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import {Allowance} from "../types/Allowance.sol";

/**
 * @title AllowanceLoader
 * @notice Loads allowances from storage and calculates accrued balances
 *
 * @author gnosisguild
 */
library AllowanceLoader {
    function accrue(
        bytes32 allowanceKey,
        uint64 blockTimestamp
    ) internal view returns (uint128 balance, uint64 timestamp) {
        Allowance memory a = _load(allowanceKey);

        // No refill configured.
        if (a.period == 0) return (a.balance, a.timestamp);

        uint64 nextAccrualAt = a.timestamp + a.period;
        // Not enough time elapsed to complete a period.
        if (blockTimestamp < nextAccrualAt) return (a.balance, a.timestamp);

        // Calculate full periods elapsed
        uint64 elapsedIntervals = (blockTimestamp - a.timestamp) / a.period;
        // Timestamp always advances, even when balance is at cap
        timestamp = a.timestamp + elapsedIntervals * a.period;

        // Already at cap, or initial balance was set above maxRefill
        if (a.balance >= a.maxRefill) return (a.balance, timestamp);

        // Add refill for each elapsed period, capping at maxRefill.
        uint128 accruedBalance = a.balance + (a.refill * elapsedIntervals);
        balance = accruedBalance < a.maxRefill ? accruedBalance : a.maxRefill;
    }

    /**
     *
     * Storage Layout (2 words, 64 bytes, 512 bits):
     * ┌────────────────────────────────┬────────────────────────────────┐
     * │           maxRefill            │             refill             │
     * │            128 bits            │            128 bits            │
     * ├────────────────┬───────────────┴───────────────┬────────────────┤
     * │   timestamp    │            balance            │     period     │
     * │    64 bits     │           128 bits            │    64 bits     │
     * └────────────────┴───────────────────────────────┴────────────────┘
     *
     */
    uint256 constant ALLOWANCES_SLOT = 106;
    function _load(
        bytes32 allowanceKey
    ) private view returns (Allowance memory) {
        uint256 word1;
        uint256 word2;
        assembly {
            mstore(0x00, allowanceKey)
            mstore(0x20, ALLOWANCES_SLOT)
            let slot := keccak256(0x00, 0x40)
            word1 := sload(slot)
            word2 := sload(add(slot, 1))
        }

        return
            Allowance({
                refill: uint128(word1),
                maxRefill: uint128(word1 >> 128),
                period: uint64(word2),
                balance: uint128(word2 >> 64),
                timestamp: uint64(word2 >> 192)
            });
    }
}
