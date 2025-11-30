// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./_Core.sol";

/**
 * @title ConsumptionTracker
 * @notice Persists allowance consumptions to storage using a two-phase commit.
 *
 * @dev Balances are written before execution to prevent reentrancy attacks.
 * On failure, original balances are restored.
 *
 * @author gnosisguild
 */
abstract contract ConsumptionTracker is Core {
    event ConsumeAllowance(
        bytes32 allowanceKey,
        uint128 consumed,
        uint128 newBalance
    );

    /**
     * @dev Writes new balances to storage before execution. Not final.
     * @param consumptions Allowance consumption records to persist.
     */
    function _flushPrepare(Consumption[] memory consumptions) internal {
        uint256 count = consumptions.length;

        for (uint256 i; i < count; ) {
            Consumption memory consumption = consumptions[i];

            assert(consumption.consumed <= consumption.balance);

            _store(
                consumption.allowanceKey,
                consumption.timestamp,
                consumption.balance - consumption.consumed
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Emits events on success, restores balances on failure.
     * @param consumptions Allowance consumption records.
     * @param success Whether execution succeeded.
     */
    function _flushCommit(
        Consumption[] memory consumptions,
        bool success
    ) internal {
        uint256 count = consumptions.length;
        for (uint256 i; i < count; ) {
            Consumption memory consumption = consumptions[i];
            if (success) {
                emit ConsumeAllowance(
                    consumption.allowanceKey,
                    consumption.consumed,
                    consumption.balance - consumption.consumed
                );
            } else {
                _store(
                    consumption.allowanceKey,
                    consumption.timestamp,
                    consumption.balance
                );
            }
            unchecked {
                ++i;
            }
        }
    }

    /// @dev Stores allowance. Writes only word2, preserving period.
    function _store(
        bytes32 allowanceKey,
        uint64 timestamp_,
        uint128 balance_
    ) private {
        /**
         * Storage Layout (2 words, 64 bytes, 512 bits):
         * ┌────────────────────────────────┬────────────────────────────────┐
         * │           maxRefill            │             refill             │
         * │            128 bits            │            128 bits            │
         * ├────────────────┬───────────────┴───────────────┬────────────────┤
         * │   timestamp    │            balance            │     period     │
         * │    64 bits     │           128 bits            │    64 bits     │
         * └────────────────┴───────────────────────────────┴────────────────┘
         */

        assembly {
            mstore(0x00, allowanceKey)
            mstore(0x20, allowances.slot)

            let slot := add(keccak256(0x00, 0x40), 1)

            sstore(
                slot,
                or(
                    or(shl(192, timestamp_), shl(64, balance_)),
                    and(sload(slot), 0xffffffffffffffff) // mask period (lower 64 bits)
                )
            )
        }
    }
}
