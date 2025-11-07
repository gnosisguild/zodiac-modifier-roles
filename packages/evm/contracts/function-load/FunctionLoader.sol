// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../ScopeConfig.sol";
import "../WriteOnce.sol";

import "./unpackers/FunctionUnpacker.sol";

/**
 * @title FunctionLoader - a component of the Zodiac Roles Mod that handles
 * the writing and reading of permission data to and from storage.
 *
 * @author gnosisguild
 *
 */
library FunctionLoader {
    function load(
        bytes32 scopeConfig
    )
        internal
        view
        returns (
            Condition memory condition,
            TypeTree memory typeTree,
            bytes32[] memory allowanceKeys
        )
    {
        (, , address pointer) = ScopeConfig.unpack(scopeConfig);
        bytes memory buffer = WriteOnce.load(pointer);
        return FunctionUnpacker.unpack(buffer);
    }

    // function _patchEqualToAvatar(Condition memory node) private view {
    //     if (node.operator == Operator.EqualToAvatar) {
    //         node.operator = Operator.EqualTo;
    //         node.compValue = keccak256(abi.encode(avatar));
    //     }
    //     for (uint256 i; i < node.children.length; ++i) {
    //         _patchEqualToAvatar(node.children[i]);
    //     }
    // }
}
