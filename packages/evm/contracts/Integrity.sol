// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";

/**
 * @title Integrity, A library that validates condition integrity, and
 * adherence to the expected input structure and rules.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Integrity {
    error UnsuitableRootNode();

    error NotBFS();

    error UnsuitableParameterType(uint256 index);

    error UnsuitableCompValue(uint256 index);

    error UnsupportedOperator(uint256 index);

    error UnsuitableParent(uint256 index);

    error UnsuitableChildCount(uint256 index);

    error UnsuitableChildTypeTree(uint256 index);

    function enforce(ConditionFlat[] memory conditions) external pure {
        _root(conditions);
        for (uint256 i = 0; i < conditions.length; ++i) {
            _node(conditions[i], i);
        }
        _tree(conditions);
    }

    function _root(ConditionFlat[] memory conditions) private pure {
        uint256 count;

        unchecked {
            for (uint256 i; i < conditions.length; ++i) {
                if (conditions[i].parent == i) ++count;
            }
            if (count != 1 || conditions[0].parent != 0) {
                revert UnsuitableRootNode();
            }
        }
    }

    function _node(ConditionFlat memory condition, uint256 index) private pure {
        Operator operator = condition.operator;
        ParameterType paramType = condition.paramType;
        bytes memory compValue = condition.compValue;
        if (operator == Operator.Pass) {
            if (condition.compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator >= Operator.And && operator <= Operator.Nor) {
            if (paramType != ParameterType.None) {
                revert UnsuitableParameterType(index);
            }
            if (condition.compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Matches) {
            if (
                paramType != ParameterType.Tuple &&
                paramType != ParameterType.Array &&
                paramType != ParameterType.AbiEncoded
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.ArraySome ||
            operator == Operator.ArrayEvery ||
            operator == Operator.ArraySubset
        ) {
            if (paramType != ParameterType.Array) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.EqualToAvatar) {
            if (paramType != ParameterType.Static) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.EqualTo) {
            if (
                paramType != ParameterType.Static &&
                paramType != ParameterType.Dynamic &&
                paramType != ParameterType.Tuple &&
                paramType != ParameterType.Array
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length == 0 || compValue.length % 32 != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.GreaterThan ||
            operator == Operator.LessThan ||
            operator == Operator.SignedIntGreaterThan ||
            operator == Operator.SignedIntLessThan
        ) {
            if (paramType != ParameterType.Static) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Bitmask) {
            if (
                paramType != ParameterType.Static &&
                paramType != ParameterType.Dynamic
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Custom) {
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.WithinAllowance) {
            if (paramType != ParameterType.Static) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.EtherWithinAllowance ||
            operator == Operator.CallWithinAllowance
        ) {
            if (paramType != ParameterType.None) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else {
            revert UnsupportedOperator(index);
        }
    }

    function _tree(ConditionFlat[] memory conditions) private pure {
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

        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            Topology.Bounds memory childBounds = childrenBounds[i];

            if (condition.paramType == ParameterType.None) {
                if (
                    (condition.operator == Operator.EtherWithinAllowance ||
                        condition.operator == Operator.CallWithinAllowance) &&
                    childBounds.length != 0
                ) {
                    revert UnsuitableChildCount(i);
                }
                if (
                    (condition.operator >= Operator.And &&
                        condition.operator <= Operator.Nor)
                ) {
                    if (childBounds.length == 0) {
                        revert UnsuitableChildCount(i);
                    }
                }
            } else if (
                condition.paramType == ParameterType.Static ||
                condition.paramType == ParameterType.Dynamic
            ) {
                if (childBounds.length != 0) {
                    revert UnsuitableChildCount(i);
                }
            } else if (
                condition.paramType == ParameterType.Tuple ||
                condition.paramType == ParameterType.AbiEncoded
            ) {
                if (childBounds.length == 0) {
                    revert UnsuitableChildCount(i);
                }
            } else {
                assert(condition.paramType == ParameterType.Array);

                if (childBounds.length == 0) {
                    revert UnsuitableChildCount(i);
                }

                if (
                    (condition.operator == Operator.ArraySome ||
                        condition.operator == Operator.ArrayEvery) &&
                    childBounds.length != 1
                ) {
                    revert UnsuitableChildCount(i);
                } else if (
                    condition.operator == Operator.ArraySubset &&
                    childBounds.length > 256
                ) {
                    revert UnsuitableChildCount(i);
                }
            }
        }

        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            if (
                ((condition.operator >= Operator.And &&
                    condition.operator <= Operator.Nor) ||
                    condition.paramType == ParameterType.Array) &&
                childrenBounds[i].length > 1
            ) {
                compatiblechildTypeTree(conditions, i, childrenBounds);
            }
        }

        Topology.TypeTree memory typeTree = Topology.typeTree(
            conditions,
            0,
            childrenBounds
        );

        if (typeTree.paramType != ParameterType.AbiEncoded) {
            revert UnsuitableRootNode();
        }
    }

    function compatiblechildTypeTree(
        ConditionFlat[] memory conditions,
        uint256 index,
        Topology.Bounds[] memory childrenBounds
    ) private pure {
        uint256 start = childrenBounds[index].start;
        uint256 end = childrenBounds[index].end;

        bytes32 id = typeTreeId(
            Topology.typeTree(conditions, start, childrenBounds)
        );
        for (uint256 j = start + 1; j < end; ++j) {
            if (
                id !=
                typeTreeId(Topology.typeTree(conditions, j, childrenBounds))
            ) {
                revert UnsuitableChildTypeTree(index);
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
