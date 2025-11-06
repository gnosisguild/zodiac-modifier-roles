// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./_Core.sol";
import "./Consumptions.sol";
import "./WriteOnce.sol";
import "./FunctionWriter.sol";

import "./packers/FunctionHeaderPacker.sol";
import "./packers/ScopedFunctionUnpacker.sol";

/**
 * @title PermissionLoader - a component of the Zodiac Roles Mod that handles
 * the writing and reading of permission data to and from storage.
 *
 * @author gnosisguild
 *
 */
abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal override {
        address pointer = FunctionWriter.store(conditions);
        role.scopeConfig[key] = FunctionHeaderPacker.pack(options, pointer);
    }

    function _load(
        Role storage role,
        bytes32 key
    )
        internal
        view
        override
        returns (
            Condition memory condition,
            TypeTree memory typeTree,
            Consumption[] memory consumptions
        )
    {
        uint256 avatarCount;
        bytes32[] memory allowanceKeys;
        (, , address pointer) = FunctionHeaderPacker.unpack(
            role.scopeConfig[key]
        );
        bytes memory buffer = WriteOnce.load(pointer);
        (
            condition,
            typeTree,
            allowanceKeys,
            avatarCount
        ) = ScopedFunctionUnpacker.unpack(buffer);

        if (avatarCount > 0) {
            _patchEqualToAvatar(condition);
        }

        return (
            condition,
            typeTree,
            allowanceKeys.length > 0
                ? _consumptions(allowanceKeys)
                : consumptions
        );
    }

    function _consumptions(
        bytes32[] memory allowanceKeys
    ) private view returns (Consumption[] memory result) {
        uint256 count = allowanceKeys.length;

        result = new Consumption[](count);

        uint256 insert;

        for (uint256 i; i < count; ++i) {
            bytes32 key = allowanceKeys[i];
            result[insert].allowanceKey = key;
            (result[insert].balance, ) = _accruedAllowance(
                allowances[key],
                uint64(block.timestamp)
            );
            insert++;
        }
    }

    function _patchEqualToAvatar(Condition memory node) private view {
        if (node.operator == Operator.EqualToAvatar) {
            node.operator = Operator.EqualTo;
            node.compValue = keccak256(abi.encode(avatar));
        }
        for (uint256 i; i < node.children.length; ++i) {
            _patchEqualToAvatar(node.children[i]);
        }
    }
}
