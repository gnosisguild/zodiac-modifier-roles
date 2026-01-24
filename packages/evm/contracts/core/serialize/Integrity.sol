// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./TypeTree.sol";

import "../../types/Types.sol";

/**
 * @title Integrity
 * @notice A library that validates input condition integrity
 *
 * @author gnosisguild
 */
library Integrity {
    function enforce(ConditionFlat[] memory conditions) internal pure {
        _validateBFS(conditions);

        uint256 len = conditions.length;
        for (uint256 i = 0; i < len; ++i) {
            _validateOperator(conditions, i);
            _validateEncoding(conditions, i);
        }

        // Inter Node Constraints
        _validatePluckOrder(conditions, 0, 0);
        _validateTypeTrees(conditions);
    }

    function _validateBFS(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;
        if (length == 0 || conditions[0].parent != 0) {
            revert IRolesError.UnsuitableRootNode();
        }

        for (uint256 i = 1; i < length; ++i) {
            uint256 parent = conditions[i].parent;
            if (parent == i) {
                revert IRolesError.UnsuitableRootNode();
            }
            // Parent must have lower index (no forward references)
            if (parent < conditions[i - 1].parent) {
                revert IRolesError.NotBFS();
            }
            // Parent cannot be higher than self
            if (parent >= i) {
                revert IRolesError.NotBFS();
            }
        }
    }

    function _validateOperator(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        Operator op = conditions[index].operator;

        if (op == Operator.Pass) {
            _checkPass(conditions, index);
        } else if (op == Operator.And || op == Operator.Or) {
            _checkLogic(conditions, index);
        } else if (op == Operator.Empty) {
            _checkEmpty(conditions, index);
        } else if (op == Operator.Matches) {
            _checkMatches(conditions, index);
        } else if (op == Operator.ArraySome || op == Operator.ArrayEvery) {
            _checkArrayIterator(conditions, index);
        } else if (op == Operator.ArrayTailMatches) {
            _checkArrayTail(conditions, index);
        } else if (op == Operator.Slice) {
            _checkSlice(conditions, index);
        } else if (op == Operator.Pluck) {
            _checkPluck(conditions, index);
        } else if (op == Operator.EqualToAvatar) {
            _checkEqualToAvatar(conditions, index);
        } else if (op == Operator.EqualTo) {
            _checkEqualTo(conditions, index);
        } else if (
            op == Operator.GreaterThan ||
            op == Operator.LessThan ||
            op == Operator.SignedIntGreaterThan ||
            op == Operator.SignedIntLessThan
        ) {
            _checkComparison(conditions, index);
        } else if (op == Operator.Bitmask) {
            _checkBitmask(conditions, index);
        } else if (op == Operator.Custom) {
            _checkCustom(conditions, index);
        } else if (op == Operator.WithinAllowance) {
            _checkWithinAllowance(conditions, index);
        } else if (op == Operator.CallWithinAllowance) {
            _checkCallWithinAllowance(conditions, index);
        } else if (op == Operator.WithinRatio) {
            _checkWithinRatio(conditions, index);
        } else {
            revert IRolesError.UnsupportedOperator(index);
        }
    }

    // -------------------------------------------------------------------------
    // Encoding Validation
    // -------------------------------------------------------------------------

    /**
     * @notice Validates child constraints based on encoding type.
     *
     * @dev Encoding types determine fundamental child rules:
     *      - Leaf types (Static, Dynamic, EtherValue): Cannot have children
     *      - Container types (Tuple, Array): Must have structural children
     *      - Abstract types (None, AbiEncoded): Operator-dependent (validated elsewhere)
     *
     *      Exception: Slice operator uses Static/Dynamic encoding but requires
     *      exactly one child (validated in _checkSlice).
     */
    function _validateEncoding(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        Encoding encoding = node.paramType;

        (, uint256 childCount, uint256 sChildCount) = TypeTree.childBounds(
            conditions,
            index
        );

        if (
            encoding == Encoding.Static ||
            encoding == Encoding.Dynamic ||
            encoding == Encoding.EtherValue
        ) {
            // Slice is a special case: uses Static/Dynamic but requires a child
            if (node.operator != Operator.Slice) {
                // Leaf types cannot have children
                if (childCount != 0) {
                    revert IRolesError.LeafNodeCannotHaveChildren(index);
                }
            }
        }

        if (encoding == Encoding.Tuple || encoding == Encoding.Array) {
            // Container types must have structural children for type tree
            if (sChildCount == 0) {
                revert IRolesError.UnsuitableChildCount(index);
            }
        }
    }

    // --- Operator Handlers ---

    function _checkPass(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // Encoding: Any
        // CompValue: Must be empty
        if (node.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkLogic(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // And/Or
        // ParamType: None
        if (node.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (node.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: Must have children
        (, uint256 childCount, ) = TypeTree.childBounds(conditions, index);
        if (childCount == 0) {
            revert IRolesError.UnsuitableChildCount(index);
        }
    }

    function _checkEmpty(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: None
        if (node.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (node.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: None
        (, uint256 childCount, ) = TypeTree.childBounds(conditions, index);
        if (childCount != 0) {
            revert IRolesError.LeafNodeCannotHaveChildren(index);
        }
    }

    function _checkMatches(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: Tuple, Array, AbiEncoded
        if (
            node.paramType != Encoding.Tuple &&
            node.paramType != Encoding.Array &&
            node.paramType != Encoding.AbiEncoded
        ) {
            revert IRolesError.UnsuitableParameterType(index);
        }

        // CompValue Validation
        if (node.paramType == Encoding.AbiEncoded) {
            uint16 leadingBytes = node.compValue.length >= 2
                ? uint16(bytes2(node.compValue))
                : 0;
            bool valid = node.compValue.length == 0 ||
                node.compValue.length == 2 ||
                (node.compValue.length == 2 + leadingBytes &&
                    leadingBytes <= 32);
            if (!valid) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else {
            if (node.compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        }

        // All children must be structural
        (, uint256 childCount, uint256 sChildCount) = TypeTree.childBounds(
            conditions,
            index
        );
        if (sChildCount == 0 || childCount != sChildCount) {
            revert IRolesError.UnsuitableChildCount(index);
        }
    }

    function _checkArrayIterator(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ArraySome / ArrayEvery
        // ParamType: Array
        if (node.paramType != Encoding.Array) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (node.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: Exactly 1 child
        (, uint256 childCount, uint256 sChildCount) = TypeTree.childBounds(
            conditions,
            index
        );
        if (childCount != 1 || sChildCount != 1) {
            revert IRolesError.UnsuitableChildCount(index);
        }
    }

    function _checkArrayTail(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ArrayTailMatches
        // ParamType: Array
        if (node.paramType != Encoding.Array) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (node.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: All children must be structural
        (, uint256 childCount, uint256 sChildCount) = TypeTree.childBounds(
            conditions,
            index
        );
        if (sChildCount == 0 || childCount != sChildCount) {
            revert IRolesError.UnsuitableChildCount(index);
        }
    }

    function _checkSlice(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: Static / Dynamic
        if (
            node.paramType != Encoding.Static &&
            node.paramType != Encoding.Dynamic
        ) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 3 bytes
        if (node.compValue.length != 3) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        uint8 size = uint8(node.compValue[2]);
        if (size == 0 || size > 32) {
            revert IRolesError.UnsuitableCompValue(index);
        }

        // Children: At most 1 child
        (uint256 childStart, uint256 childCount, uint256 sChildCount) = TypeTree
            .childBounds(conditions, index);
        if (childCount != 1) {
            revert IRolesError.UnsuitableChildCount(index);
        }

        // If it has a structural child, it must resolve to Static
        if (sChildCount != 1) {
            revert IRolesError.SliceChildNotStatic(index);
        }

        if (TypeTree.resolvesTo(conditions, childStart) != Encoding.Static) {
            revert IRolesError.SliceChildNotStatic(index);
        }
    }

    function _checkPluck(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: Static / EtherValue
        if (!_isWordish(node.paramType)) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 1 byte
        if (node.compValue.length != 1 || uint8(node.compValue[0]) == 255) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkEqualToAvatar(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: Static
        if (node.paramType != Encoding.Static) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (node.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkEqualTo(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        Encoding enc = node.paramType;
        // ParamType: Static, Dynamic, Tuple, Array, EtherValue
        if (enc == Encoding.None || enc == Encoding.AbiEncoded) {
            revert IRolesError.UnsuitableParameterType(index);
        }

        // CompValue check
        bool unsuitable;
        if (_isWordish(enc)) {
            unsuitable = node.compValue.length != 32;
        }

        if (enc == Encoding.Tuple || enc == Encoding.Array) {
            unsuitable = node.compValue.length < 32;
        }

        if (unsuitable) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkComparison(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: WordLike
        if (!_isWordish(node.paramType)) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 32 bytes
        if (node.compValue.length != 32) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkBitmask(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: Static / Dynamic
        if (
            node.paramType != Encoding.Static &&
            node.paramType != Encoding.Dynamic
        ) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 2 shift + 2N
        if (node.compValue.length < 4 || (node.compValue.length - 2) % 2 != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkCustom(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // CompValue: >= 20 bytes
        if (node.compValue.length < 20) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkWithinAllowance(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: WordLike
        if (!_isWordish(node.paramType)) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 32, 34, 54
        if (
            node.compValue.length != 32 &&
            node.compValue.length != 34 &&
            node.compValue.length != 54
        ) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        if (node.compValue.length > 32) {
            if (
                uint8(node.compValue[32]) > 27 || uint8(node.compValue[33]) > 27
            ) {
                revert IRolesError.AllowanceDecimalsExceedMax(index);
            }
        }
    }

    function _checkCallWithinAllowance(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: None
        if (node.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 32 bytes
        if (node.compValue.length != 32) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: None
        (, uint256 childCount, ) = TypeTree.childBounds(conditions, index);
        if (childCount != 0) {
            revert IRolesError.LeafNodeCannotHaveChildren(index);
        }
    }

    function _checkWithinRatio(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory node = conditions[index];
        // ParamType: None
        if (node.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 12, 32 or 52 bytes (12 base + 0, 1, or 2 adapters)
        if (
            node.compValue.length != 12 &&
            node.compValue.length != 32 &&
            node.compValue.length != 52
        ) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Check ratio bounds
        uint32 minRatio;
        uint32 maxRatio;
        bytes memory cv = node.compValue;
        assembly {
            minRatio := shr(224, mload(add(cv, 0x24)))
            maxRatio := shr(224, mload(add(cv, 0x28)))
        }
        if (minRatio == 0 && maxRatio == 0) {
            revert IRolesError.WithinRatioNoRatioProvided(index);
        }
        // Children: None
        (, uint256 childCount, ) = TypeTree.childBounds(conditions, index);
        if (childCount != 0) {
            revert IRolesError.LeafNodeCannotHaveChildren(index);
        }
    }

    // -------------------------------------------------------------------------
    // Global Constraints & Helpers
    // -------------------------------------------------------------------------

    /**
     * @notice Validates plucked variable definitions precede their usage.
     *
     * @dev Evaluation happens in DFS order, so this function must check that
     *      definitions come before usages in DFS order.
     *
     *      While the flat `conditions` array is stored in BFS order (parents
     *      first), this function traverses the tree in DFS order to track the
     *      `visited` state of plucked variables. This ensures that a
     *      `WithinRatio` check can only reference variables that have been
     *      "plucked" by a preceding node in the execution flow.
     */
    function _validatePluckOrder(
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

        (uint256 childStart, uint256 childCount, ) = TypeTree.childBounds(
            conditions,
            index
        );

        for (uint256 i = 0; i < childCount; ++i) {
            visited = _validatePluckOrder(conditions, childStart + i, visited);
        }

        return visited;
    }

    function _validateTypeTrees(
        ConditionFlat[] memory conditions
    ) private pure {
        for (uint256 i = 0; i < conditions.length; ++i) {
            Operator operator = conditions[i].operator;
            Encoding encoding = conditions[i].paramType;

            if (
                operator == Operator.And ||
                operator == Operator.Or ||
                encoding == Encoding.Array
            ) {
                // If not variant, children have matching type trees (same typeHash)
                // If variant, must check type equivalence (all resolve to Dynamic/AbiEncoded)
                if (
                    TypeTree.isVariant(conditions, i) &&
                    !_isTypeEquivalence(conditions, i)
                ) {
                    revert IRolesError.UnsuitableChildTypeTree(i);
                }
            }
        }
    }

    // --- Helpers ---

    function _isWordish(Encoding encoding) private pure returns (bool) {
        return encoding == Encoding.Static || encoding == Encoding.EtherValue;
    }

    function _isTypeEquivalence(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        (uint256 childStart, , uint256 sChildCount) = TypeTree.childBounds(
            conditions,
            index
        );

        for (uint256 i = 0; i < sChildCount; ++i) {
            Encoding encoding = TypeTree.resolvesTo(conditions, childStart + i);
            if (
                encoding != Encoding.Dynamic && encoding != Encoding.AbiEncoded
            ) {
                return false;
            }
        }
        return true;
    }
}
