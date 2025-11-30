// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";
import "./TypeTree.sol";

import {IRolesError} from "../../../types/RolesError.sol";

/**
 * @title Integrity, A library that validates condition integrity, and
 * adherence to the expected input structure and rules.
 *
 * @author gnosisguild
 */

/*
 * TODO test following aspects:
 * Enforce Tuples and Arrays to have children
 * Enforce in general nodes to have at least one structural children, for nodes that require children
 * Validated variants accross different Array entries as well
 * Validate compValue for allowance to be either: 32 bytes, 52 bytes or 54 bytes
 * Validate allowance decimals are equal or smaller than 18
 */

library Integrity {
    function enforce(ConditionFlat[] memory conditions) internal pure {
        _root(conditions);
        _bfs(conditions);
        for (uint256 i = 0; i < conditions.length; ++i) {
            _node(conditions[i], i);
        }
        _parents(conditions);
        _children(conditions);
        _nonStructuralOrdering(conditions);
        _typeTree(conditions);

        if (TypeTree.inspect(conditions, 0).encoding != Encoding.Calldata) {
            revert IRolesError.UnsuitableRootNode();
        }
    }

    function _root(ConditionFlat[] memory conditions) private pure {
        uint256 count;

        for (uint256 i; i < conditions.length; ++i) {
            if (conditions[i].parent == i) ++count;
        }
        if (count != 1 || conditions[0].parent != 0) {
            revert IRolesError.UnsuitableRootNode();
        }
    }

    function _bfs(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;
        // check BFS
        for (uint256 i = 1; i < length; ++i) {
            if (conditions[i - 1].parent > conditions[i].parent) {
                revert IRolesError.NotBFS();
            }

            if (conditions[i].parent > i) {
                revert IRolesError.NotBFS();
            }
        }
    }

    function _node(ConditionFlat memory condition, uint256 index) private pure {
        Operator operator = condition.operator;
        Encoding encoding = condition.paramType;
        bytes memory compValue = condition.compValue;
        if (operator == Operator.Pass) {
            if (condition.compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.And || operator == Operator.Or) {
            if (encoding != Encoding.None) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (condition.compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Matches) {
            if (
                encoding != Encoding.Tuple &&
                encoding != Encoding.Array &&
                encoding != Encoding.Calldata &&
                encoding != Encoding.AbiEncoded
            ) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.ArraySome || operator == Operator.ArrayEvery
        ) {
            if (encoding != Encoding.Array) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.ArrayTailMatches) {
            if (encoding != Encoding.Array) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.EqualToAvatar) {
            if (encoding != Encoding.Static) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.EqualTo) {
            if (
                encoding != Encoding.Static &&
                encoding != Encoding.Dynamic &&
                encoding != Encoding.Tuple &&
                encoding != Encoding.Array
            ) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length == 0 || compValue.length % 32 != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.GreaterThan ||
            operator == Operator.LessThan ||
            operator == Operator.SignedIntGreaterThan ||
            operator == Operator.SignedIntLessThan
        ) {
            if (encoding != Encoding.Static) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Bitmask) {
            if (encoding != Encoding.Static && encoding != Encoding.Dynamic) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Custom) {
            if (compValue.length != 32) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.WithinAllowance) {
            if (encoding != Encoding.Static) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // 32 bytes: allowanceKey only (legacy)
            // 54 bytes: allowanceKey + adapter + accrueDecimals + paramDecimals
            if (compValue.length != 32 && compValue.length != 54) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.EtherWithinAllowance) {
            if (encoding != Encoding.None) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // 32 bytes: allowanceKey only (legacy)
            // 54 bytes: allowanceKey + adapter + accrueDecimals + paramDecimals
            if (compValue.length != 32 && compValue.length != 54) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.CallWithinAllowance) {
            if (encoding != Encoding.None) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // CallWithinAllowance always uses value=1, price adapter doesn't make sense
            if (compValue.length != 32) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.WithinRatio) {
            if (encoding != Encoding.None) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length < 32 || compValue.length > 52) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else {
            revert IRolesError.UnsupportedOperator(index);
        }
    }

    function _parents(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;

        for (uint256 i = 0; i < length; ++i) {
            if (
                conditions[i].operator == Operator.EtherWithinAllowance ||
                conditions[i].operator == Operator.CallWithinAllowance
            ) {
                (
                    uint256 countCalldataNodes,
                    ,
                    uint256 countOtherNodes
                ) = _countParentNodes(conditions, i);

                if (countCalldataNodes != 1 || countOtherNodes > 0) {
                    revert IRolesError.UnsuitableParent(i);
                }
            } else if (conditions[i].operator == Operator.WithinRatio) {
                // WithinRatio can be anywhere except as the root node
                if (conditions[i].parent == i) {
                    revert IRolesError.UnsuitableParent(i);
                }
            }
        }
    }

    function _children(ConditionFlat[] memory conditions) private pure {
        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            (, uint256 childCount, uint256 sChildCount) = Topology.childBounds(
                conditions,
                i
            );

            if (condition.paramType == Encoding.None) {
                if (
                    (condition.operator == Operator.EtherWithinAllowance ||
                        condition.operator == Operator.CallWithinAllowance ||
                        condition.operator == Operator.WithinRatio) &&
                    childCount != 0
                ) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
                if (
                    condition.operator == Operator.And ||
                    condition.operator == Operator.Or
                ) {
                    if (childCount == 0) {
                        revert IRolesError.UnsuitableChildCount(i);
                    }
                }
            } else if (
                condition.paramType == Encoding.Static ||
                condition.paramType == Encoding.Dynamic
            ) {
                if (childCount != 0) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
            } else if (condition.paramType == Encoding.Tuple) {
                if (sChildCount == 0) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
            } else if (
                condition.paramType == Encoding.Calldata ||
                condition.paramType == Encoding.AbiEncoded
            ) {
                if (childCount == 0) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
            } else {
                assert(condition.paramType == Encoding.Array);

                if (sChildCount == 0) {
                    revert IRolesError.UnsuitableChildCount(i);
                }

                if (
                    (condition.operator == Operator.ArraySome ||
                        condition.operator == Operator.ArrayEvery) &&
                    childCount != 1
                ) {
                    revert IRolesError.UnsuitableChildCount(i);
                }

                // Enforce only structural children for array iteration operators
                if (
                    (condition.operator == Operator.ArraySome ||
                        condition.operator == Operator.ArrayEvery ||
                        condition.operator == Operator.ArrayTailMatches) &&
                    childCount != sChildCount
                ) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
            }
        }
    }

    function _nonStructuralOrdering(
        ConditionFlat[] memory conditions
    ) private pure {
        for (uint256 i = 0; i < conditions.length; ++i) {
            (uint256 childStart, uint256 childCount, ) = Topology.childBounds(
                conditions,
                i
            );

            if (childCount == 0) continue;

            // Once we see a non-structural child, all remaining must be non-structural
            bool seenNonStructural = false;
            for (uint256 j = 0; j < childCount; j++) {
                uint256 childIndex = childStart + j;
                bool isStructural = Topology.isStructural(
                    conditions,
                    childIndex
                );

                if (seenNonStructural && isStructural) {
                    // Structural child found after non-structural child
                    revert IRolesError.NonStructuralChildrenMustComeLast(i);
                }

                if (!isStructural) {
                    seenNonStructural = true;
                }
            }
        }
    }

    function _typeTree(ConditionFlat[] memory conditions) private pure {
        for (uint256 i = 0; i < conditions.length; ++i) {
            ConditionFlat memory condition = conditions[i];
            if (
                condition.operator == Operator.And ||
                condition.operator == Operator.Or ||
                condition.paramType == Encoding.Array
            ) {
                if (
                    !_isTypeMatch(conditions, i) &&
                    !_isTypeEquivalence(conditions, i)
                ) {
                    revert IRolesError.UnsuitableChildTypeTree(i);
                }
            }

            _withinRatio(conditions, i);
        }
    }

    function _isTypeMatch(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        (uint256 childStart, , uint256 sChildCount) = Topology.childBounds(
            conditions,
            index
        );

        if (sChildCount == 1) {
            return true;
        }

        bytes32 id = TypeTree.id(conditions, childStart);
        for (uint256 i = 1; i < sChildCount; ++i) {
            if (id != TypeTree.id(conditions, childStart + i)) return false;
        }

        return true;
    }
    function _isTypeEquivalence(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        (uint256 childStart, , uint256 sChildCount) = Topology.childBounds(
            conditions,
            index
        );

        for (uint256 i = 0; i < sChildCount; ++i) {
            Encoding encoding = TypeTree
                .inspect(conditions, childStart + i)
                .encoding;
            if (
                encoding != Encoding.Dynamic &&
                encoding != Encoding.Calldata &&
                encoding != Encoding.AbiEncoded
            ) {
                return false;
            }
        }
        return true;
    }

    function _countParentNodes(
        ConditionFlat[] memory conditions,
        uint256 i
    )
        private
        pure
        returns (
            uint256 countCalldata,
            uint256 countLogical,
            uint256 countOther
        )
    {
        for (uint256 j = conditions[i].parent; ; ) {
            bool isCalldata = conditions[j].paramType == Encoding.Calldata;
            bool isLogical = (conditions[j].operator == Operator.And ||
                conditions[j].operator == Operator.Or);

            if (isCalldata) {
                ++countCalldata;
            }

            if (isLogical) {
                ++countLogical;
            }

            if (!isCalldata && !isLogical) {
                ++countOther;
            }

            if (j == 0) {
                break;
            }

            j = conditions[j].parent;
        }
    }

    /**
     * @notice Validates WithinRatio operator constraints
     * @dev Checks that:
     *      1. At least one ratio bound (min or max) is provided
     *      2. Referenced indices are within parent's children bounds
     *      3. Referenced children resolve to non-variant Static types
     */
    function _withinRatio(
        ConditionFlat[] memory conditions,
        uint256 i
    ) private pure {
        if (conditions[i].operator != Operator.WithinRatio) {
            return;
        }

        bytes memory compValue = conditions[i].compValue;
        bytes32 compValue32 = bytes32(compValue);

        // Extract indices and ratios from compValue
        uint8 referenceIndex = uint8(bytes1(compValue32));
        uint8 relativeIndex = uint8(bytes1(compValue32 << 16));
        uint32 minRatio = uint32(bytes4(compValue32 << 32));
        uint32 maxRatio = uint32(bytes4(compValue32 << 64));
        // Validate that at least one ratio is provided
        if (minRatio == 0 && maxRatio == 0) {
            revert IRolesError.WithinRatioNoRatioProvided(i);
        }

        // Find nearest structural parent (should be Calldata/Tuple/Array)
        uint256 parentIndex = conditions[i].parent;
        while (conditions[parentIndex].paramType == Encoding.None) {
            parentIndex = conditions[parentIndex].parent;
        }

        // Get parent's children bounds
        (uint256 childStart, , ) = Topology.childBounds(
            conditions,
            parentIndex
        );

        {
            // Check reference child is Static
            Layout memory layout = TypeTree.inspect(
                conditions,
                childStart + referenceIndex
            );
            if (layout.encoding != Encoding.Static) {
                revert IRolesError.WithinRatioTargetNotStatic(i);
            }
        }

        {
            // Check relative child is Static
            Layout memory layout = TypeTree.inspect(
                conditions,
                childStart + relativeIndex
            );
            if (layout.encoding != Encoding.Static) {
                revert IRolesError.WithinRatioTargetNotStatic(i);
            }
        }
    }
}
