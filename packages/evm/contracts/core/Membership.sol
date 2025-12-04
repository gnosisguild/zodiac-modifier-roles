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
    uint256 private constant _MEMBERSHIP_NOOP = type(uint256).max;
    uint256 private constant _MEMBERSHIP_REVOKE = 0;

    function _authenticate(
        bytes32 roleKey
    )
        internal
        moduleOnly
        returns (
            address sender,
            bytes32 resolvedRoleKey,
            uint256 nextMembership
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

        uint256 packed = roles[roleKey].members[sender];
        if (packed == 0) {
            revert NoMembership();
        }

        uint64 start = uint64(packed >> 192);
        uint64 end = uint64(packed >> 128);
        uint128 usesLeft = uint128(packed);

        if (block.timestamp < start) {
            revert MembershipNotYetValid();
        }
        if (block.timestamp > end) {
            revert MembershipExpired();
        }

        if (usesLeft == type(uint128).max) {
            return (sender, roleKey, _MEMBERSHIP_NOOP);
        }

        // Decrement uses
        unchecked {
            usesLeft = usesLeft - 1;
        }

        return (
            sender,
            roleKey,
            usesLeft == 0
                ? _MEMBERSHIP_REVOKE
                : (uint256(start) << 192) |
                    (uint256(end) << 128) |
                    uint256(usesLeft)
        );
    }
}
