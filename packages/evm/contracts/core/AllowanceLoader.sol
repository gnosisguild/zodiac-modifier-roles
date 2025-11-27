// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../types/All.sol";

/**
 * @title AllowanceLoader
 * @notice Library for loading and storing Allowance structs from storage
 * @dev Uses assembly for direct slot access
 *
 * Storage bit layout for Allowance (high bits ← low bits):
 *   word1 (slot):   | maxRefill (128) | refill (128) |
 *   word2 (slot+1): | timestamp (64)  | balance (128) | period (64) |
 *
 * Note: Fields appear reversed because Solidity packs struct members
 * starting from the least significant bits.
 *
 * @author gnosisguild
 */
library AllowanceLoader {
    uint256 constant ALLOWANCES_SLOT = 106;

    function accrue(
        bytes32 allowanceKey,
        uint64 blockTimestamp
    ) internal view returns (uint128 balance, uint64 timestamp) {
        Allowance memory allowance = load(allowanceKey);

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

    function load(
        bytes32 allowanceKey
    ) internal view returns (Allowance memory) {
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

    function store(bytes32 allowanceKey, uint128 newBalance) internal {
        uint256 word2;
        assembly {
            mstore(0x00, allowanceKey)
            mstore(0x20, ALLOWANCES_SLOT)
            word2 := sload(add(keccak256(0x00, 0x40), 1))
        }
        _store(allowanceKey, uint64(word2 >> 192), newBalance, uint64(word2));
    }

    function store(
        bytes32 allowanceKey,
        uint64 newTimestamp,
        uint128 newBalance
    ) internal {
        uint256 word2;
        assembly {
            mstore(0x00, allowanceKey)
            mstore(0x20, ALLOWANCES_SLOT)
            word2 := sload(add(keccak256(0x00, 0x40), 1))
        }
        _store(allowanceKey, newTimestamp, newBalance, uint64(word2));
    }

    function _store(
        bytes32 allowanceKey,
        uint256 timestamp_,
        uint256 balance_,
        uint256 period
    ) private {
        assembly {
            mstore(0x00, allowanceKey)
            mstore(0x20, ALLOWANCES_SLOT)
            let slot := add(keccak256(0x00, 0x40), 1)

            // Pack:  timestamp (64) | balance (128) | period (64)
            let word2 := or(shl(192, timestamp_), or(shl(64, balance_), period))
            sstore(slot, word2)
        }
    }
}
