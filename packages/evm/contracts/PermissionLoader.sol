// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Consumptions.sol";
import "./Core.sol";
import "./Topology.sol";
import "./WriteOnce.sol";

import "./packers/Packer.sol";

/**
 * @title PermissionLoader - a component of the Zodiac Roles Mod that handles
 * the writing and reading of permission data to and from storage.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */
abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal override {
        bytes memory buffer = Packer.pack(conditions);
        address pointer = WriteOnce.store(buffer);

        role.scopeConfig[key] = BufferPacker.packHeader(
            conditions.length,
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
        (uint256 count, address pointer) = BufferPacker.unpackHeader(
            role.scopeConfig[key]
        );
        bytes memory buffer = WriteOnce.load(pointer);
        (
            ConditionFlat[] memory conditionsFlat,
            bytes32[] memory compValues
        ) = BufferPacker.unpackBody(buffer, count);

        uint256 allowanceCount;

        for (uint256 i; i < conditionsFlat.length; ) {
            Operator operator = conditionsFlat[i].operator;
            if (operator >= Operator.WithinAllowance) {
                ++allowanceCount;
            } else if (operator == Operator.EqualToAvatar) {
                // patch Operator.EqualToAvatar which in reality works as
                // a placeholder
                conditionsFlat[i].operator = Operator.EqualTo;
                compValues[i] = keccak256(abi.encode(avatar));
            }
            unchecked {
                ++i;
            }
        }

        _conditionTree(
            conditionsFlat,
            compValues,
            Topology.childrenBounds(conditionsFlat),
            0,
            condition
        );

        return (
            condition,
            allowanceCount > 0
                ? _consumptions(conditionsFlat, compValues, allowanceCount)
                : consumptions
        );
    }

    function _conditionTree(
        ConditionFlat[] memory conditionsFlat,
        bytes32[] memory compValues,
        Topology.Bounds[] memory childrenBounds,
        uint256 index,
        Condition memory treeNode
    ) private pure {
        // This function populates a buffer received as an argument instead of
        // instantiating a result object. This is an important gas optimization

        ConditionFlat memory conditionFlat = conditionsFlat[index];
        treeNode.paramType = conditionFlat.paramType;
        treeNode.operator = conditionFlat.operator;
        treeNode.compValue = compValues[index];

        if (childrenBounds[index].length == 0) {
            return;
        }

        uint256 start = childrenBounds[index].start;
        uint256 length = childrenBounds[index].length;

        treeNode.children = new Condition[](length);
        for (uint j; j < length; ) {
            _conditionTree(
                conditionsFlat,
                compValues,
                childrenBounds,
                start + j,
                treeNode.children[j]
            );
            unchecked {
                ++j;
            }
        }
    }

    function _consumptions(
        ConditionFlat[] memory conditions,
        bytes32[] memory compValues,
        uint256 maxAllowanceCount
    ) private view returns (Consumption[] memory result) {
        uint256 count = conditions.length;
        result = new Consumption[](maxAllowanceCount);

        uint256 insert;

        for (uint256 i; i < count; ++i) {
            if (conditions[i].operator < Operator.WithinAllowance) {
                continue;
            }

            bytes32 key = compValues[i];
            (, bool contains) = Consumptions.find(result, key);
            if (contains) {
                continue;
            }

            result[insert].allowanceKey = key;
            (result[insert].balance, ) = _accruedAllowance(
                allowances[key],
                uint64(block.timestamp)
            );
            insert++;
        }

        if (insert < maxAllowanceCount) {
            assembly {
                mstore(result, insert)
            }
        }
    }
}
