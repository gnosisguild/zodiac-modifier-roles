// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Storage.sol";

/**
 * @title Membership - Validates role membership, including validity windows
 *        and usage limits.
 *
 * @notice Accepts calls sent directly by a module or signed by an enabled
 *         module and relayed by another account.
 *
 * @author gnosisguild
 */
abstract contract Membership is RolesStorage {
    uint192 private constant _NO_UPDATE = type(uint192).max;
    uint192 private constant _REVOKE = 0;

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
        if (usesLeft == type(uint64).max) {
            return (sender, roleKey, _NO_UPDATE);
        }

        // Decrement uses
        unchecked {
            usesLeft = usesLeft - 1;
        }

        // Delete if exhausted, otherwise pack: start | (end << 64) | (usesLeft << 128)
        return (
            sender,
            roleKey,
            usesLeft == 0
                ? _REVOKE
                : uint192(start) |
                    (uint192(end) << 64) |
                    (uint192(usesLeft) << 128)
        );
    }
}
