// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Storage.sol";

import {Consumption} from "../../types/Allowance.sol";

/**
 * @title ConsumptionTracker - Persists allowance and membership updates to
 *        storage.
 *
 * @dev Allowance balances are written before execution to prevent reentrancy.
 *      On failure, original balances are restored. Membership is written only
 *      on success.
 *
 * @author gnosisguild
 */
abstract contract ConsumptionTracker is RolesStorage {
    /**
     * @dev Writes new balances to storage before execution. Not final.
     * @param consumptions Allowance consumption records to persist.
     */
    function _flushPrepare(Consumption[] memory consumptions) internal {
        uint256 count = consumptions.length;

        for (uint256 i; i < count; ) {
            Consumption memory consumption = consumptions[i];

            assert(consumption.consumed <= consumption.balance);

            _storeAllowance(
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
     * @dev Commits all pending storage updates.
     *
     * Allowances: emits events on success, restores balances on failure.
     * Membership: writes on success only.
     */
    function _flushCommit(
        address sender,
        bytes32 roleKey,
        uint192 nextMembership,
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
                _storeAllowance(
                    consumption.allowanceKey,
                    consumption.timestamp,
                    consumption.balance
                );
            }
            unchecked {
                ++i;
            }
        }

        if (success && nextMembership != type(uint192).max) {
            _storeMembership(roleKey, sender, nextMembership);
        }
    }

    /// @dev Stores allowance. Writes only word2, preserving period.
    function _storeAllowance(
        bytes32 allowanceKey,
        uint64 timestamp_,
        uint128 balance_
    ) private {
        /*
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

    /// @dev Stores membership. Writes packed value directly via assembly.
    function _storeMembership(
        bytes32 roleKey,
        address sender,
        uint192 packed
    ) private {
        assembly {
            // roles[roleKey].members[sender]
            mstore(0x00, roleKey)
            mstore(0x20, roles.slot)
            let roleSlot := keccak256(0x00, 0x40)

            mstore(0x00, sender)
            mstore(0x20, roleSlot)
            let slot := keccak256(0x00, 0x40)

            sstore(slot, packed)
        }
    }
}
