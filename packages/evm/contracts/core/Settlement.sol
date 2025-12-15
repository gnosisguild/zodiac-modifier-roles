// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Storage.sol";

import {Consumption} from "../types/Allowance.sol";

/**
 * @title Settlement - Persists allowance and membership consumptions to storage.
 *
 * @dev Allowance balances are written before execution to prevent reentrancy.
 *      On failure, original balances are restored. Membership is written only
 *      on success.
 *
 * @author gnosisguild
 */
abstract contract Settlement is RolesStorage {
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
     * @dev Commits all pending storage updates.
     *
     * Allowances: emits events on success, restores balances on failure.
     * Membership: writes on success only.
     *
     * @param nextMembership Packed membership data: [start:64][end:64][usesLeft:128].
     *        Use uint256.max for no-op (skip membership update).
     */
    function _flushCommit(
        address sender,
        bytes32 roleKey,
        uint256 nextMembership,
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

        if (success && nextMembership != type(uint256).max) {
            // uint256.max == noop
            roles[roleKey].members[sender] = nextMembership;
            if (nextMembership != 0) {
                emit UpdateRole(
                    roleKey,
                    sender,
                    uint64(nextMembership >> 192),
                    uint64(nextMembership >> 128),
                    uint128(nextMembership)
                );
            } else {
                emit RevokeRole(roleKey, sender);
            }
        }
    }

    /// @dev Stores allowance. Writes only word2, preserving period.
    function _store(
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
}
