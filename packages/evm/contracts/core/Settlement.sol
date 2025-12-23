// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Storage.sol";

import {Consumption} from "../types/Allowance.sol";

/**
 * @title Settlement - Persists allowance and membership consumptions to storage.
 *
 * @dev Called after successful execution. Reentrancy is prevented by the
 *      nonReentrant modifier in RolesStorage on execution entry points.
 *
 * @author gnosisguild
 */
abstract contract Settlement is RolesStorage {
    /**
     * @dev Writes allowance and membership updates to storage after successful execution.
     *
     * @param sender The address that initiated the transaction
     * @param roleKey The role key used for execution
     * @param nextMembership Packed membership data. uint256.max skips membership update
     * @param consumptions Allowance consumption records to persist
     */
    function _flush(
        address sender,
        bytes32 roleKey,
        uint256 nextMembership,
        Consumption[] memory consumptions
    ) internal {
        uint256 count = consumptions.length;
        for (uint256 i; i < count; ++i) {
            Consumption memory consumption = consumptions[i];

            assert(consumption.consumed <= consumption.balance);

            uint128 updatedBalance = _commitConsumption(consumption);

            emit ConsumeAllowance(
                consumption.allowanceKey,
                consumption.consumed,
                updatedBalance
            );
        }

        // uint256.max == noop
        if (nextMembership == type(uint256).max) return;

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

    /// @dev Writes consumption to allowance storage, returns new balance.
    function _commitConsumption(
        Consumption memory consumption
    ) private returns (uint128 updatedBalance) {
        bytes32 allowanceKey = consumption.allowanceKey;
        uint64 _timestamp = consumption.timestamp;
        updatedBalance = consumption.balance - consumption.consumed;

        /*
         * Allowance Storage Layout (2 words):
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
                    or(shl(192, _timestamp), shl(64, updatedBalance)),
                    and(sload(slot), 0xffffffffffffffff)
                )
            )
        }
    }
}
