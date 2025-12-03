// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Storage.sol";
import {RoleMembership} from "../types/Permission.sol";

/**
 * @title Membership - Validates role membership including validity windows
 *        and usage limits.
 *
 * @author gnosisguild
 */
abstract contract Membership is RolesStorage {
    uint192 constant NO_UPDATE = type(uint192).max;
    uint192 constant DELETE = 0;
    uint64 constant UNLIMITED = type(uint64).max;

    function _authenticate(
        bytes32 roleKey
    )
        internal
        moduleOnly
        returns (
            address sender,
            bytes32 resolvedRoleKey,
            uint192 nextMembership
        )
    {
        sender = sentOrSignedByModule();
        assert(sender != address(0));

        // if zero, means we gotta load default role
        roleKey = roleKey == 0 ? defaultRoles[sender] : roleKey;

        // Never authorize the zero role
        if (roleKey == 0) {
            revert NoMembership();
        }

        RoleMembership storage membership = roles[roleKey].members[sender];

        uint64 start = membership.start;
        uint64 end = membership.end;
        uint64 usesLeft = membership.usesLeft;

        if (start == 0 && end == 0 && usesLeft == 0) {
            revert NoMembership();
        }

        // Validate timestamps
        if (block.timestamp < start) {
            revert MembershipNotYetValid();
        }
        if (block.timestamp > end) {
            revert MembershipExpired();
        }

        // Handle uses limit
        if (usesLeft == UNLIMITED) {
            return (sender, roleKey, NO_UPDATE);
        }

        // Decrement uses
        usesLeft = usesLeft - 1;

        return (
            sender,
            roleKey,
            usesLeft == 0 ? DELETE : _pack(start, end, usesLeft)
        );
    }

    function _storeMembership(
        address sender,
        bytes32 roleKey,
        uint192 nextMembership
    ) internal {
        assert(nextMembership != NO_UPDATE);

        if (nextMembership == DELETE) {
            delete roles[roleKey].members[sender];
        } else {
            (uint64 start, uint64 end, uint64 usesLeft) = _unpack(
                nextMembership
            );
            roles[roleKey].members[sender] = RoleMembership({
                start: start,
                end: end,
                usesLeft: usesLeft
            });
        }
    }

    /// @dev Packs membership config into uint192
    function _pack(
        uint64 start,
        uint64 end,
        uint64 usesLeft
    ) private pure returns (uint192) {
        return
            uint192(start) | (uint192(end) << 64) | (uint192(usesLeft) << 128);
    }

    /// @dev Unpacks uint192 into membership config fields
    function _unpack(
        uint192 packed
    ) private pure returns (uint64 start, uint64 end, uint64 usesLeft) {
        start = uint64(packed);
        end = uint64(packed >> 64);
        usesLeft = uint64(packed >> 128);
    }
}
