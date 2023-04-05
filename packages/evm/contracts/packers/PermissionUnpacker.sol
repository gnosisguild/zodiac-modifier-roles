// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

import "../Consumptions.sol";
import "../Topology.sol";

import "./BufferPacker.sol";

/**
 * @title PermissionUnpacker - a library that coordinates the process of unpacking
 * a storage optimized buffer into in memory conditions.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library PermissionUnpacker {
    function unpack(
        bytes memory buffer,
        uint256 paramCount
    )
        internal
        pure
        returns (Condition memory result, Consumption[] memory consumptions)
    {
        (
            ConditionFlat[] memory conditions,
            bytes32[] memory compValues,
            uint256 allowanceCount
        ) = BufferPacker.unpackBody(buffer, paramCount);

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
        unchecked {
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
            for (uint j; j < count; ++j) {
                _unpackCondition(
                    conditions,
                    compValues,
                    childrenBounds,
                    start + j,
                    result.children[j]
                );
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
        unchecked {
            for (uint256 i; i < conditions.length; ++i) {
                if (conditions[i].operator < Operator.WithinAllowance) {
                    continue;
                }

                (, bool contains) = Consumptions.find(result, compValues[i]);
                if (!contains) {
                    result[insert].allowanceKey = compValues[i];
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
}
