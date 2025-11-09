// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./_Core.sol";

import "./permission-storage/deserialize/Deserializer.sol";
import "./permission-storage/serialize/Serializer.sol";

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
        role.scopeConfig[key] = Serializer.store(conditions, options);
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
        bytes32[] memory allowanceKeys;
        (condition, typeTree, allowanceKeys) = Deserializer.load(
            role.scopeConfig[key]
        );

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
}
