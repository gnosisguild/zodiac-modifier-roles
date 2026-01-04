// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";
import "./TypeTree.sol";

import {IRolesError} from "../../types/RolesError.sol";

/**
 * @title Integrity, A library that validates condition integrity, and
 * adherence to the expected input structure and rules.
 *
 * @author gnosisguild
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
        _pluckOrder(conditions, 0, 0);
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
        } else if (operator == Operator.Empty) {
            if (encoding != Encoding.None) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Matches) {
            if (
                encoding != Encoding.Tuple &&
                encoding != Encoding.Array &&
                encoding != Encoding.AbiEncoded
            ) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // For AbiEncoded, compValue must be:
            //    - empty (leadingBytes defaults to 4)
            //    - 2 bytes (leadingBytes, any offset)
            //    - 2 + N bytes (leadingBytes + N match bytes, N <= 32)
            // For Tuple/Array: compValue must be empty
            if (encoding == Encoding.AbiEncoded) {
                uint16 leadingBytes = compValue.length >= 2
                    ? uint16(bytes2(compValue))
                    : 0;
                bool valid = compValue.length == 0 ||
                    compValue.length == 2 ||
                    (compValue.length == 2 + leadingBytes &&
                        leadingBytes <= 32);

                if (!valid) {
                    revert IRolesError.UnsuitableCompValue(index);
                }
            } else if (compValue.length != 0) {
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
        } else if (operator == Operator.Slice) {
            // Slice can be applied to Static or Dynamic parameters
            if (encoding != Encoding.Static && encoding != Encoding.Dynamic) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // compValue must be 3 bytes: 2 bytes shift + 1 byte size (1-32)
            if (compValue.length != 3) {
                revert IRolesError.UnsuitableCompValue(index);
            }
            uint8 size = uint8(compValue[2]);
            if (size == 0 || size > 32) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Pluck) {
            // Pluck must be Static or EtherValue
            if (!_isWordLike(encoding)) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // compValue is the index (1 byte, 0-254 to avoid overflow in count)
            if (compValue.length != 1 || uint8(compValue[0]) > 254) {
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
                encoding != Encoding.Array &&
                encoding != Encoding.EtherValue
            ) {
                revert IRolesError.UnsuitableParameterType(index);
            }

            bool unsuitable;
            if (_isWordLike(encoding)) {
                unsuitable = compValue.length != 32;
            } else if (encoding == Encoding.Dynamic) {
                unsuitable = compValue.length == 0;
            } else {
                unsuitable = compValue.length < 32;
            }

            if (unsuitable) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.GreaterThan ||
            operator == Operator.LessThan ||
            operator == Operator.SignedIntGreaterThan ||
            operator == Operator.SignedIntLessThan
        ) {
            if (!_isWordLike(encoding)) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Bitmask) {
            if (encoding != Encoding.Static && encoding != Encoding.Dynamic) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // compValue layout: | 2 bytes: shift | N bytes: mask | N bytes: expected |
            if (compValue.length < 4 || (compValue.length - 2) % 2 != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Custom) {
            if (compValue.length < 20) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else if (operator == Operator.WithinAllowance) {
            if (!_isWordLike(encoding)) {
                revert IRolesError.UnsuitableParameterType(index);
            }
            // 32 bytes: allowanceKey only (legacy)
            // 54 bytes: allowanceKey + adapter + accrueDecimals + paramDecimals
            if (compValue.length != 32 && compValue.length != 54) {
                revert IRolesError.UnsuitableCompValue(index);
            }
            if (compValue.length == 54) {
                if (uint8(compValue[52]) > 18 || uint8(compValue[53]) > 18) {
                    revert IRolesError.AllowanceDecimalsExceedMax(index);
                }
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
            if (conditions[i].operator == Operator.CallWithinAllowance) {
                if (conditions[i].parent != i) {
                    (, , uint256 countOtherNodes) = _countParentNodes(
                        conditions,
                        i
                    );

                    if (countOtherNodes > 0) {
                        revert IRolesError.UnsuitableParent(i);
                    }
                }
            } else if (conditions[i].operator == Operator.Empty) {
                if (conditions[i].parent != i) {
                    (
                        uint256 countAbiEncoded,
                        ,
                        uint256 countOtherNodes
                    ) = _countParentNodes(conditions, i);

                    if (countAbiEncoded > 0 || countOtherNodes > 0) {
                        revert IRolesError.UnsuitableParent(i);
                    }
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
                    (condition.operator == Operator.CallWithinAllowance ||
                        condition.operator == Operator.WithinRatio ||
                        condition.operator == Operator.Empty) && childCount != 0
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
            } else if (condition.paramType == Encoding.Static) {
                // Slice can have at most one child; other Static operators have no children
                if (condition.operator == Operator.Slice) {
                    if (childCount > 1) {
                        revert IRolesError.UnsuitableChildCount(i);
                    }
                } else {
                    if (childCount != 0) {
                        revert IRolesError.UnsuitableChildCount(i);
                    }
                }
            } else if (condition.paramType == Encoding.Dynamic) {
                // Slice can have at most one child; other Dynamic operators have no children
                if (condition.operator == Operator.Slice) {
                    if (childCount > 1) {
                        revert IRolesError.UnsuitableChildCount(i);
                    }
                } else {
                    if (childCount != 0) {
                        revert IRolesError.UnsuitableChildCount(i);
                    }
                }
            } else if (condition.paramType == Encoding.Tuple) {
                if (sChildCount == 0) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
            } else if (condition.paramType == Encoding.AbiEncoded) {
                if (childCount == 0) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
            } else if (condition.paramType == Encoding.Array) {
                if (sChildCount == 0) {
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

                if (
                    (condition.operator == Operator.ArraySome ||
                        condition.operator == Operator.ArrayEvery) &&
                    childCount != 1
                ) {
                    revert IRolesError.UnsuitableChildCount(i);
                }
            } else {
                assert(condition.paramType == Encoding.EtherValue);
                // EtherValue is non-structural, no children allowed
                if (childCount != 0) {
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

            _slice(conditions, i);
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
                encoding != Encoding.Dynamic && encoding != Encoding.AbiEncoded
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
            uint256 countAbiEncoded,
            uint256 countLogical,
            uint256 countOther
        )
    {
        for (uint256 j = conditions[i].parent; ; ) {
            bool isAbiEncoded = conditions[j].paramType == Encoding.AbiEncoded;
            bool isLogical = (conditions[j].operator == Operator.And ||
                conditions[j].operator == Operator.Or);

            if (isAbiEncoded) {
                ++countAbiEncoded;
            }

            if (isLogical) {
                ++countLogical;
            }

            if (!isAbiEncoded && !isLogical) {
                ++countOther;
            }

            if (j == 0) {
                break;
            }

            j = conditions[j].parent;
        }
    }

    function _slice(ConditionFlat[] memory conditions, uint256 i) private pure {
        if (conditions[i].operator != Operator.Slice) {
            return;
        }

        (uint256 childStart, , uint256 sChildCount) = Topology.childBounds(
            conditions,
            i
        );

        // Slice must have exactly one child that resolves to Static
        if (sChildCount == 0) {
            revert IRolesError.SliceChildNotStatic(i);
        }

        Layout memory layout = TypeTree.inspect(conditions, childStart);
        if (layout.encoding != Encoding.Static) {
            revert IRolesError.SliceChildNotStatic(i);
        }
    }

    /**
     * @notice Validates WithinRatio operator constraints
     * @dev Checks that at least one ratio bound (min or max) is provided
     */
    function _withinRatio(
        ConditionFlat[] memory conditions,
        uint256 i
    ) private pure {
        if (conditions[i].operator != Operator.WithinRatio) {
            return;
        }

        bytes memory compValue = conditions[i].compValue;

        // Layout: referenceIndex(1) + referenceDecimals(1) + relativeIndex(1) + relativeDecimals(1)
        //         + minRatio(4) + maxRatio(4) + referenceAdapter(0|20) + relativeAdapter(0|20)
        uint32 minRatio;
        uint32 maxRatio;
        assembly {
            // Skip 32 bytes for memory length + 4 bytes (indices + decimals)
            // minRatio is at offset 4 (0x24 from compValue pointer)
            minRatio := shr(224, mload(add(compValue, 0x24)))
            // maxRatio is at offset 8 (0x28 from compValue pointer)
            maxRatio := shr(224, mload(add(compValue, 0x28)))
        }

        // Validate that at least one ratio is provided
        if (minRatio == 0 && maxRatio == 0) {
            revert IRolesError.WithinRatioNoRatioProvided(i);
        }
    }

    /**
     * @notice Ensures pluck values are extracted before being referenced, in
     *         DFS traversal order
     */
    function _pluckOrder(
        ConditionFlat[] memory conditions,
        uint256 index,
        uint256 visited
    ) private pure returns (uint256) {
        ConditionFlat memory condition = conditions[index];

        if (condition.operator == Operator.Pluck) {
            uint8 pluckIndex = uint8(condition.compValue[0]);
            visited |= (1 << pluckIndex);
        }

        if (condition.operator == Operator.WithinRatio) {
            uint8 referenceIndex = uint8(condition.compValue[0]);

            if ((visited & (1 << referenceIndex)) == 0) {
                revert IRolesError.PluckNotVisitedBeforeRef(
                    index,
                    referenceIndex
                );
            }

            uint8 relativeIndex = uint8(condition.compValue[2]);
            if ((visited & (1 << relativeIndex)) == 0) {
                revert IRolesError.PluckNotVisitedBeforeRef(
                    index,
                    relativeIndex
                );
            }
        }

        (uint256 childStart, uint256 childCount, ) = Topology.childBounds(
            conditions,
            index
        );

        for (uint256 i = 0; i < childCount; ++i) {
            visited = _pluckOrder(conditions, childStart + i, visited);
        }

        return visited;
    }

    function _isWordLike(Encoding encoding) private pure returns (bool) {
        return encoding == Encoding.Static || encoding == Encoding.EtherValue;
    }
}
