// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

import "./Core.sol";

import "./Consumptions.sol";
import "./ScopeConfig.sol";
import "./Topology.sol";
import "./WriteOnce.sol";

/**
 * @title PermissionLoader - a component of the Zodiac Roles Mod that handles
 * the packing, writing, reading, and unpacking of permission data to and from
 * storage.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.pm>
 */
abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal override {
        bytes memory buffer = _pack(conditions);
        address pointer = WriteOnce.store(buffer);
        role.scopeConfig[key] = ScopeConfig.packHeader(
            conditions.length,
            false,
            options,
            pointer
        );
    }

    function _load(
        Role storage role,
        bytes32 key
    )
        internal
        view
        override
        returns (Condition memory condition, Consumption[] memory consumptions)
    {
        (uint256 length, , , address pointer) = ScopeConfig.unpackHeader(
            role.scopeConfig[key]
        );
        bytes memory buffer = WriteOnce.load(pointer);

        (condition, consumptions) = _unpack(buffer, length);

        for (uint256 i; i < consumptions.length; ++i) {
            (consumptions[i].balance, ) = _accruedAllowance(
                allowances[consumptions[i].allowanceKey],
                block.timestamp
            );
        }
    }

    function _pack(
        ConditionFlat[] memory conditions
    ) private pure returns (bytes memory buffer) {
        buffer = new bytes(ScopeConfig.packedSize(conditions));

        uint256 paramCount = conditions.length;
        uint256 offset = 32 + paramCount * 2;
        for (uint256 i; i < paramCount; ) {
            ScopeConfig.packCondition(buffer, i, conditions[i]);
            if (conditions[i].operator >= Operator.EqualTo) {
                ScopeConfig.packCompValue(buffer, offset, conditions[i]);
                offset += 32;
            }

            unchecked {
                ++i;
            }
        }
    }

    function _unpack(
        bytes memory buffer,
        uint256 paramCount
    )
        private
        view
        returns (Condition memory result, Consumption[] memory consumptions)
    {
        (
            ConditionFlat[] memory conditions,
            bytes32[] memory compValues,
            uint256 allowanceCount
        ) = ScopeConfig.unpackConditions(buffer, paramCount);

        _unpackCondition(
            conditions,
            compValues,
            Topology.childrenBounds(conditions),
            0,
            result
        );

        return (
            result,
            allowanceCount > 0
                ? _unpackConsumptions(conditions, compValues, allowanceCount)
                : consumptions
        );
    }

    function _unpackCondition(
        ConditionFlat[] memory conditions,
        bytes32[] memory compValues,
        Topology.Bounds[] memory childrenBounds,
        uint256 index,
        Condition memory result
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        result.paramType = condition.paramType;
        result.operator = condition.operator;
        result.compValue = compValues[index];

        if (childrenBounds[index].length == 0) {
            return;
        }

        uint256 start = childrenBounds[index].start;
        uint256 count = childrenBounds[index].length;

        result.children = new Condition[](count);
        for (uint j; j < count; ) {
            _unpackCondition(
                conditions,
                compValues,
                childrenBounds,
                start + j,
                result.children[j]
            );

            unchecked {
                ++j;
            }
        }
    }

    function _unpackConsumptions(
        ConditionFlat[] memory conditions,
        bytes32[] memory compValues,
        uint256 maxAllowanceCount
    ) private pure returns (Consumption[] memory result) {
        result = new Consumption[](maxAllowanceCount);

        uint256 insert;
        for (uint256 i; i < conditions.length; ++i) {
            if (conditions[i].operator < Operator.WithinAllowance) {
                continue;
            }
            bytes32 allowanceKey = compValues[i];
            if (!Consumptions.contains(result, allowanceKey)) {
                result[insert].allowanceKey = allowanceKey;
                insert++;
            }
        }

        if (insert < maxAllowanceCount) {
            assembly {
                mstore(result, insert)
            }
        }
    }
}
