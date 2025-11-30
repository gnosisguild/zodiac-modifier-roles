// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Allowance} from "../../types/Allowance.sol";

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
        return _accrue(_load(allowanceKey), blockTimestamp);
    }

    function accrue(
        Allowance memory allowance,
        uint64 blockTimestamp
    ) internal pure returns (uint128 balance, uint64 timestamp) {
        return _accrue(allowance, blockTimestamp);
    }

    function _accrue(
        Allowance memory allowance,
        uint64 blockTimestamp
    ) private pure returns (uint128 balance, uint64 timestamp) {
        if (
            allowance.period == 0 ||
            blockTimestamp < (allowance.timestamp + allowance.period)
        ) {
            return (allowance.balance, allowance.timestamp);
        }

        uint64 elapsedIntervals = (blockTimestamp - allowance.timestamp) /
            allowance.period;

        if (allowance.balance < allowance.maxRefill) {
            balance = allowance.balance + allowance.refill * elapsedIntervals;
            balance = balance < allowance.maxRefill
                ? balance
                : allowance.maxRefill;
        } else {
            balance = allowance.balance;
        }

        timestamp = allowance.timestamp + elapsedIntervals * allowance.period;
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
