// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Modifier.sol";

import "./types/All.sol";

/**
 * @title Core is the base contract for the Zodiac Roles Mod, which defines
 * the common abstract connection points between Builder, Loader, and Checker.
 *
 * @author gnosisguild
 *
 */
abstract contract Core is Modifier {
    mapping(bytes32 => Role) internal roles;
    mapping(bytes32 => Allowance) public allowances;

    function _key(
        address targetAddress,
        bytes4 selector
    ) internal pure returns (bytes32) {
        return bytes32(bytes20(targetAddress)) | (bytes32(selector) >> 160);
    }
}
