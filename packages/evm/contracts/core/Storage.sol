// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Modifier.sol";

import "../types/All.sol";

/**
 * @title RolesStorage
 * @notice Base contract defining shared storage for Zodiac Roles Mod
 *
 * @author gnosisguild
 *
 */
abstract contract RolesStorage is Modifier {
    mapping(bytes32 => Role) internal roles;
    mapping(bytes32 => Allowance) public allowances;
    mapping(bytes32 => address) public unwrappers;

    function _key(
        address targetAddress,
        bytes4 selector
    ) internal pure returns (bytes32) {
        return bytes32(bytes20(targetAddress)) | (bytes32(selector) >> 160);
    }
}
