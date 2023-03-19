// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./WriteOnce.sol";

import "./Core.sol";
import "./Topology.sol";
import "./ScopeConfig.sol";

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
    ) internal view override returns (Condition memory result) {
        (uint256 length, , , address pointer) = ScopeConfig.unpackHeader(
            role.scopeConfig[key]
        );
        bytes memory buffer = WriteOnce.load(pointer);
        result = _unpack(buffer, length);
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
    ) private pure returns (Condition memory result) {
        (
            ConditionFlat[] memory conditions,
            bytes32[] memory compValues
        ) = ScopeConfig.unpackConditions(buffer, paramCount);

        _unpack(
            conditions,
            compValues,
            Topology.childrenBounds(conditions),
            0,
            result
        );
    }

    function _unpack(
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
            _unpack(
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
}
