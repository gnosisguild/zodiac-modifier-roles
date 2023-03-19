// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

library Integrity {
    error NoRootNodeFound();

    error MultipleRootNodesFound();

    error FlatButNotBFS();

    error UnsuitableParent(uint256 index);

    error UnsuitableComparison(uint256 index);

    error UnsuitableType(uint256 index);

    error UnsuitableRelativeComparison();

    error UnsuitableSubsetOfComparison();

    error UnsuitableStaticCompValueSize();

    error UnsuitableChildTypeTree(uint256 index);

    error NoCompValuesProvidedForScope();

    error TooManyCompValuesForScope();

    error InvalidComparison();

    error NotEnoughChildren(uint256 index);

    error MalformedBitmask(uint256 index);

    error UnsuitableComparisonForTypeNone(uint256 index);

    function validate(ConditionFlat[] memory conditions) internal pure {
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
            revert NoRootNodeFound();
        }

        if (count > 1) {
            revert MultipleRootNodesFound();
        }
    }

    function topology(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;
        // check BFS
        for (uint256 i = 1; i < length; ++i) {
            if (conditions[i - 1].parent > conditions[i].parent) {
                revert FlatButNotBFS();
            }
        }

        for (uint256 i = 0; i < length; ++i) {
            if (
                (conditions[i].operator == Operator.ETHWithinAllowance ||
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

        // check at least 2 children for relational nodes
        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            if (
                condition.paramType == ParameterType.None &&
                (condition.operator == Operator.Or ||
                    condition.operator == Operator.And)
            ) {
                if (condition.compValue.length != 0) {
                    revert InvalidComparison();
                }

                if (childrenBounds[i].length < 2) {
                    revert NotEnoughChildren(i);
                }
            }
        }

        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            if (
                condition.paramType == ParameterType.None &&
                (condition.operator == Operator.Or ||
                    condition.operator == Operator.And)
            ) {
                // checkChildTypeTree(parameters, i, childrenBounds);
            }
        }

        // TODO check that Array and tuple-oneOf nodes are topologically equivalent
        // TODO a lot more integrity checks
        // TODO Extraneous can only be child of AbiEncoded or Tuple
        // TODO CallWithinAllowance must be direct child of AbiEncoded
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
                operator == Operator.ETHWithinAllowance ||
                operator == Operator.CallWithinAllowance)
        ) {
            revert UnsuitableComparison(index);
        }

        if (
            (operator == Operator.Or ||
                operator == Operator.And ||
                operator == Operator.ETHWithinAllowance ||
                operator == Operator.CallWithinAllowance) &&
            paramType != ParameterType.None
        ) {
            revert UnsuitableType(index);
        }

        if (
            (operator == Operator.GreaterThan ||
                operator == Operator.LessThan) &&
            paramType != ParameterType.Static
        ) {
            revert UnsuitableRelativeComparison();
        }

        if (
            (operator == Operator.EqualTo ||
                operator == Operator.GreaterThan ||
                operator == Operator.LessThan) &&
            paramType == ParameterType.Static &&
            compValue.length != 32
        ) {
            revert UnsuitableStaticCompValueSize();
        }

        if (operator == Operator.Bitmask) {
            if (compValue.length != 32) {
                revert MalformedBitmask(index);
            }
        }
    }

    function checkChildTypeTree(
        ConditionFlat[] memory conditions,
        uint256 index,
        Topology.Bounds[] memory childrenBounds
    ) private pure {
        uint256 start = childrenBounds[index].start;
        uint256 end = childrenBounds[index].end;

        bytes32 id = typeTreeId(conditions, start, childrenBounds);
        for (uint256 j = start + 1; j < end; ++j) {
            if (id != typeTreeId(conditions, j, childrenBounds)) {
                revert UnsuitableChildTypeTree(index);
            }
        }
    }

    function typeTreeId(
        ConditionFlat[] memory conditions,
        uint256 index,
        Topology.Bounds[] memory childrenBounds
    ) private pure returns (bytes32) {
        Topology.Bounds memory bounds = childrenBounds[index];
        ConditionFlat memory condition = conditions[index];

        uint256 childrenCount = bounds.length;
        if (
            condition.operator == Operator.And ||
            condition.operator == Operator.Or
        ) {
            assert(childrenCount >= 2);
            return typeTreeId(conditions, bounds.start, childrenBounds);
        }

        if (childrenCount > 0) {
            uint256 start = bounds.start;
            uint256 end = bounds.end;
            bytes32[] memory subIds = new bytes32[](childrenCount);
            for (uint256 i = start; i < end; ++i) {
                subIds[i - start] = typeTreeId(conditions, i, childrenBounds);
            }

            return
                keccak256(abi.encodePacked(condition.paramType, "-", subIds));
        } else {
            return bytes32(uint256(condition.paramType));
        }
    }
}
