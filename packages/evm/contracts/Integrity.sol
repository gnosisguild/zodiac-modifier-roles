// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

/**
 * @title Integrity, a library that ensures the provided configuration
 * conditions meet certain sanity checks and that the data conforms to the
 * expected data model for the roles modifier.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 */
library Integrity {
    error NoRootNode();

    error TooManyRootNodes();

    error NotBFS();

    error UnsuitableParent(uint256 index);

    error UnsuitableOperator(uint256 index);

    error UnsuitableParameterType(uint256 index);

    error UnsuitableCompValue(uint256 index);

    error UnsuitableSubTypeTree(uint256 index);

    error TooLittleChildren(uint256 index);

    error MalformedBitmask(uint256 index);

    function enforce(ConditionFlat[] memory conditions) external pure {
        root(conditions);
        topology(conditions);

        for (uint256 i = 0; i < conditions.length; ++i) {
            content(conditions[i], i);
        }
    }

    function root(ConditionFlat[] memory conditions) internal pure {
        uint256 index;
        uint256 count;

        for (uint256 i; i < conditions.length; ++i) {
            if (conditions[i].parent == i) {
                index = i;
                count++;
            }
        }
        if (count == 0) {
            revert NoRootNode();
        }

        if (count > 1) {
            revert TooManyRootNodes();
        }
    }

    function topology(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;
        // check BFS
        for (uint256 i = 1; i < length; ++i) {
            if (conditions[i - 1].parent > conditions[i].parent) {
                revert NotBFS();
            }
        }

        for (uint256 i = 0; i < length; ++i) {
            if (
                (conditions[i].operator == Operator.EtherWithinAllowance ||
                    conditions[i].operator == Operator.CallWithinAllowance) &&
                conditions[conditions[i].parent].paramType !=
                ParameterType.AbiEncoded
            ) {
                revert UnsuitableParent(i);
            }
        }

        Topology.Bounds[] memory childrenBounds = Topology.childrenBounds(
            conditions
        );

        // check at least 2 children for Ar/Or
        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            if (
                (condition.operator == Operator.Or ||
                    condition.operator == Operator.And)
            ) {
                // must be zero
                if (condition.compValue.length != 0) {
                    revert UnsuitableCompValue(i);
                }

                // must have at least two children
                if (childrenBounds[i].length < 2) {
                    revert TooLittleChildren(i);
                }
            }
        }

        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            if (
                (condition.operator == Operator.Or ||
                    condition.operator == Operator.And)
            ) {
                compatibleSubTypeTree(conditions, i, childrenBounds);
            }

            if (
                (condition.paramType == ParameterType.Array &&
                    childrenBounds[i].length > 1)
            ) {
                compatibleSubTypeTree(conditions, i, childrenBounds);
            }
        }

        // TODO bitmask only for dynamic and static
        // TODO dynamic multiple of 32
    }

    function content(
        ConditionFlat memory condition,
        uint256 index
    ) internal pure {
        bytes memory compValue = condition.compValue;
        Operator operator = condition.operator;
        ParameterType paramType = condition.paramType;

        if (
            paramType == ParameterType.None &&
            !(operator == Operator.Or ||
                operator == Operator.And ||
                operator == Operator.EtherWithinAllowance ||
                operator == Operator.CallWithinAllowance)
        ) {
            revert UnsuitableOperator(index);
        }

        if (
            (operator == Operator.Or ||
                operator == Operator.And ||
                operator == Operator.EtherWithinAllowance ||
                operator == Operator.CallWithinAllowance) &&
            paramType != ParameterType.None
        ) {
            revert UnsuitableParameterType(index);
        }

        if (
            (operator == Operator.GreaterThan ||
                operator == Operator.LessThan) &&
            paramType != ParameterType.Static
        ) {
            revert UnsuitableParameterType(index);
        }

        if (
            (operator == Operator.EqualTo ||
                operator == Operator.GreaterThan ||
                operator == Operator.LessThan) &&
            paramType == ParameterType.Static &&
            compValue.length != 32
        ) {
            revert UnsuitableCompValue(index);
        }

        if (operator >= Operator.EqualTo && compValue.length % 32 != 0) {
            revert UnsuitableCompValue(index);
        }

        if (operator == Operator.Bitmask) {
            if (
                paramType != ParameterType.Static &&
                paramType != ParameterType.Dynamic
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert MalformedBitmask(index);
            }
        }
    }

    function compatibleSubTypeTree(
        ConditionFlat[] memory conditions,
        uint256 index,
        Topology.Bounds[] memory childrenBounds
    ) private pure {
        uint256 start = childrenBounds[index].start;
        uint256 end = childrenBounds[index].end;

        bytes32 id = typeTreeId(
            Topology.subTypeTree(conditions, start, childrenBounds)
        );
        for (uint256 j = start + 1; j < end; ++j) {
            if (
                id !=
                typeTreeId(Topology.subTypeTree(conditions, j, childrenBounds))
            ) {
                revert UnsuitableSubTypeTree(index);
            }
        }
    }

    function typeTreeId(
        Topology.TypeTree memory node
    ) private pure returns (bytes32) {
        uint256 childCount = node.children.length;
        if (childCount > 0) {
            bytes32[] memory ids = new bytes32[](node.children.length);
            for (uint256 i = 0; i < childCount; ++i) {
                ids[i] = typeTreeId(node.children[i]);
            }

            return keccak256(abi.encodePacked(node.paramType, "-", ids));
        } else {
            return bytes32(uint256(node.paramType));
        }
    }
}
