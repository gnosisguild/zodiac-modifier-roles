// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";
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

        for (uint256 i = 0; i < conditions.length; ++i) {
            _validateOperator(conditions, i);
            _validateEncoding(conditions, i);
        }

        _validateTypeTrees(conditions);
        _validatePluckZipTypes(conditions);
        _validatePluckOrder(conditions, 0, 0);
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
        } else if (op == Operator.ZipSome || op == Operator.ZipEvery) {
            _checkZipIterator(conditions, index);
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
        } else if (op == Operator.WithinRatio) {
            _checkWithinRatio(conditions, index);
        } else if (op == Operator.WithinAllowance) {
            _checkWithinAllowance(conditions, index);
        } else if (op == Operator.CallWithinAllowance) {
            _checkCallWithinAllowance(conditions, index);
        } else {
            revert IRolesError.UnsupportedOperator(index);
        }
    }

    /**
     * @notice Validates child constraints based on encoding type.
     *
     * @dev Encoding types determine fundamental child rules:
     *      - Leaf types (Static, Dynamic, EtherValue): Cannot have children
     *      - Container types (Tuple, Array): Must have structural children
     *      - None: Operator-dependent (validated elsewhere)
     *
     *      Exception: Slice operator uses Static/Dynamic encoding but requires
     *      exactly one child (validated in _checkSlice).
     */
    function _validateEncoding(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding encoding = condition.paramType;

        (, uint256 childCount, uint256 sChildCount) = _sChildBounds(
            conditions,
            index
        );

        if (
            (encoding == Encoding.Static ||
                encoding == Encoding.Dynamic ||
                encoding == Encoding.EtherValue) &&
            (condition.operator != Operator.Slice)
        ) {
            // Slice is a special case: uses Static/Dynamic but requires a child
            // Leaf types cannot have children
            if (childCount != 0) {
                revert IRolesError.LeafNodeCannotHaveChildren(index);
            }
        }

        if (
            encoding == Encoding.AbiEncoded ||
            encoding == Encoding.Tuple ||
            encoding == Encoding.Array
        ) {
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
        ConditionFlat memory condition = conditions[index];
        // Encoding: Any
        // CompValue: Must be empty
        if (condition.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkLogic(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // And/Or
        // ParamType: None
        if (condition.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (condition.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: Must have children
        (, uint256 childCount) = Topology.childBounds(conditions, index);
        if (childCount == 0) {
            revert IRolesError.UnsuitableChildCount(index);
        }
    }

    function _checkEmpty(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // ParamType: None
        if (condition.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (condition.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: None
        (, uint256 childCount) = Topology.childBounds(conditions, index);
        if (childCount != 0) {
            revert IRolesError.LeafNodeCannotHaveChildren(index);
        }
    }

    function _checkMatches(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding encoding = condition.paramType;
        // ParamType: Tuple, Array, AbiEncoded
        if (
            encoding != Encoding.Tuple &&
            encoding != Encoding.Array &&
            encoding != Encoding.AbiEncoded
        ) {
            revert IRolesError.UnsuitableParameterType(index);
        }

        // CompValue Validation
        if (encoding == Encoding.AbiEncoded) {
            uint16 leadingBytes = condition.compValue.length >= 2
                ? uint16(bytes2(condition.compValue))
                : 0;
            bool valid = condition.compValue.length == 0 ||
                condition.compValue.length == 2 ||
                (condition.compValue.length == 2 + leadingBytes &&
                    leadingBytes <= 32);
            if (!valid) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        } else {
            if (condition.compValue.length != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        }

        // All children must be structural
        (, uint256 childCount, uint256 sChildCount) = _sChildBounds(
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
        ConditionFlat memory condition = conditions[index];
        // ArraySome / ArrayEvery
        // ParamType: Array
        if (condition.paramType != Encoding.Array) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (condition.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: Exactly 1 child
        (, uint256 childCount, uint256 sChildCount) = _sChildBounds(
            conditions,
            index
        );
        if (sChildCount != 1 || sChildCount != childCount) {
            revert IRolesError.UnsuitableChildCount(index);
        }
    }

    function _checkArrayTail(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // ArrayTailMatches
        // ParamType: Array
        if (condition.paramType != Encoding.Array) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (condition.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: All children must be structural
        (, uint256 childCount, uint256 sChildCount) = _sChildBounds(
            conditions,
            index
        );
        if (sChildCount == 0 || childCount != sChildCount) {
            revert IRolesError.UnsuitableChildCount(index);
        }
    }

    function _checkZipIterator(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // ZipSome / ZipEvery
        // ParamType: None
        if (condition.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: at least 2 bytes (one per plucked array)
        if (condition.compValue.length < 2) {
            revert IRolesError.UnsuitableCompValue(index);
        }

        // Validate pluck references: no duplicates, each must exist and be Array
        uint256 seen;
        for (uint256 k = 0; k < condition.compValue.length; ++k) {
            uint8 pluckIndex = uint8(condition.compValue[k]);
            uint256 mask = 1 << pluckIndex;
            if ((seen & mask) != 0) {
                revert IRolesError.UnsuitableCompValue(index);
            }
            seen |= mask;

            (bool found, uint256 pluckCondition) = _findPluckedArray(
                conditions,
                pluckIndex
            );
            if (
                !found || conditions[pluckCondition].paramType != Encoding.Array
            ) {
                revert IRolesError.UnsuitableCompValue(index);
            }
        }

        // Children: Exactly 1 child
        (
            uint256 childStart,
            uint256 childCount,
            uint256 sChildCount
        ) = _sChildBounds(conditions, index);
        if (sChildCount != 1 || sChildCount != childCount) {
            revert IRolesError.UnsuitableChildCount(index);
        }

        if (conditions[childStart].paramType != Encoding.Tuple) {
            revert IRolesError.UnsuitableChildTypeTree(index);
        }

        // Child must resolve to a Tuple
        Layout memory layout = TypeTree.resolve(conditions, childStart);
        assert(layout.encoding == Encoding.Tuple);

        // Tuple field count must match compValue length
        if (layout.children.length != condition.compValue.length) {
            revert IRolesError.UnsuitableCompValue(index);
        }

        // No Pluck allowed in zip descendants
        _validateNoPluckDescendant(conditions, childStart);
    }

    function _checkSlice(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding encoding = condition.paramType;
        // ParamType: Static / Dynamic
        if (encoding != Encoding.Static && encoding != Encoding.Dynamic) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 3 bytes
        if (condition.compValue.length != 3) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        uint8 size = uint8(condition.compValue[2]);
        if (size == 0 || size > 32) {
            revert IRolesError.UnsuitableCompValue(index);
        }

        // Children: At most 1 child
        (
            uint256 childStart,
            uint256 childCount,
            uint256 sChildCount
        ) = _sChildBounds(conditions, index);
        if (childCount != 1) {
            revert IRolesError.UnsuitableChildCount(index);
        }

        // If it has a structural child, it must resolve to Static
        if (sChildCount != 1) {
            revert IRolesError.SliceChildNotStatic(index);
        }

        if (conditions[childStart].paramType != Encoding.Static) {
            revert IRolesError.SliceChildNotStatic(index);
        }
    }

    function _checkPluck(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding encoding = condition.paramType;
        // ParamType: Static / EtherValue / Array
        if (
            encoding != Encoding.Static &&
            encoding != Encoding.EtherValue &&
            encoding != Encoding.Array
        ) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 1 byte
        if (
            condition.compValue.length != 1 ||
            uint8(condition.compValue[0]) == 255
        ) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkEqualToAvatar(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // ParamType: Static
        if (condition.paramType != Encoding.Static) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: Empty
        if (condition.compValue.length != 0) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkEqualTo(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding enc = condition.paramType;
        // ParamType: Static, Dynamic, Tuple, Array, EtherValue
        if (enc == Encoding.None || enc == Encoding.AbiEncoded) {
            revert IRolesError.UnsuitableParameterType(index);
        }

        // CompValue check
        bool unsuitable;
        if (enc == Encoding.Static || enc == Encoding.EtherValue) {
            unsuitable = condition.compValue.length != 32;
        }

        if (enc == Encoding.Tuple || enc == Encoding.Array) {
            unsuitable = condition.compValue.length < 32;
        }

        if (unsuitable) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkComparison(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding encoding = condition.paramType;
        // ParamType: WordLike
        if (encoding != Encoding.Static && encoding != Encoding.EtherValue) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 32 bytes
        if (condition.compValue.length != 32) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkBitmask(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding encoding = condition.paramType;
        // ParamType: Static / Dynamic
        if (encoding != Encoding.Static && encoding != Encoding.Dynamic) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 2 shift + 2N
        if (
            condition.compValue.length < 4 ||
            (condition.compValue.length - 2) % 2 != 0
        ) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkCustom(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // CompValue: >= 20 bytes
        if (condition.compValue.length < 20) {
            revert IRolesError.UnsuitableCompValue(index);
        }
    }

    function _checkWithinRatio(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // ParamType: None
        if (condition.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 12, 32 or 52 bytes (12 base + 0, 1, or 2 adapters)
        if (
            condition.compValue.length != 12 &&
            condition.compValue.length != 32 &&
            condition.compValue.length != 52
        ) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Check ratio bounds
        uint32 minRatio;
        uint32 maxRatio;
        bytes memory cv = condition.compValue;
        assembly {
            minRatio := shr(224, mload(add(cv, 0x24)))
            maxRatio := shr(224, mload(add(cv, 0x28)))
        }
        if (minRatio == 0 && maxRatio == 0) {
            revert IRolesError.WithinRatioNoRatioProvided(index);
        }
        // Children: None
        (, uint256 childCount) = Topology.childBounds(conditions, index);
        if (childCount != 0) {
            revert IRolesError.LeafNodeCannotHaveChildren(index);
        }
    }

    function _checkWithinAllowance(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        Encoding encoding = condition.paramType;
        // ParamType: WordLike
        if (encoding != Encoding.Static && encoding != Encoding.EtherValue) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 32, 34, 54
        if (
            condition.compValue.length != 32 &&
            condition.compValue.length != 34 &&
            condition.compValue.length != 54
        ) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        if (condition.compValue.length > 32) {
            if (
                uint8(condition.compValue[32]) > 27 ||
                uint8(condition.compValue[33]) > 27
            ) {
                revert IRolesError.AllowanceDecimalsExceedMax(index);
            }
        }
    }

    function _checkCallWithinAllowance(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        ConditionFlat memory condition = conditions[index];
        // ParamType: None
        if (condition.paramType != Encoding.None) {
            revert IRolesError.UnsuitableParameterType(index);
        }
        // CompValue: 32 bytes
        if (condition.compValue.length != 32) {
            revert IRolesError.UnsuitableCompValue(index);
        }
        // Children: None
        (, uint256 childCount) = Topology.childBounds(conditions, index);
        if (childCount != 0) {
            revert IRolesError.LeafNodeCannotHaveChildren(index);
        }
    }

    function _validateTypeTrees(
        ConditionFlat[] memory conditions
    ) private pure {
        for (uint256 i = 0; i < conditions.length; ++i) {
            bool isLogical = conditions[i].operator == Operator.And ||
                conditions[i].operator == Operator.Or;
            bool isArray = conditions[i].paramType == Encoding.Array;
            /*
             * Only Logical or Arrays hold variants
             */
            if (!isLogical && !isArray) continue;

            (uint256 childStart, uint256 childCount) = Topology.childBounds(
                conditions,
                i
            );

            Layout memory a;
            for (uint256 j = 0; j < childCount; ++j) {
                Layout memory b = TypeTree.resolve(conditions, childStart + j);
                if (TypeTree.hash(b) == 0) continue;

                if (TypeTree.hash(a) == 0) a = b;

                if (!_isTypeCompatible(a, b)) {
                    revert IRolesError.UnsuitableChildTypeTree(i);
                }
            }
        }
    }

    function _validatePluckZipTypes(
        ConditionFlat[] memory conditions
    ) private pure {
        for (uint256 i = 0; i < conditions.length; ++i) {
            Operator op = conditions[i].operator;
            if (op != Operator.ZipSome && op != Operator.ZipEvery) continue;

            (uint256 childStart, ) = Topology.childBounds(conditions, i);

            Layout memory tupleLayout = TypeTree.resolve(
                conditions,
                childStart
            );

            for (uint256 j = 0; j < tupleLayout.children.length; ++j) {
                (, uint256 pluckCondition) = _findPluckedArray(
                    conditions,
                    uint8(conditions[i].compValue[j])
                );
                Layout memory arrayLayout = TypeTree.resolve(
                    conditions,
                    pluckCondition
                );

                Layout memory entry = arrayLayout.children[0];
                Layout memory field = tupleLayout.children[j];

                if (!_isTypeCompatible(entry, field)) {
                    revert IRolesError.UnsuitableChildTypeTree(i);
                }
            }
        }
    }

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
     *      "plucked" by a preceding condition in the execution flow.
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
            uint8 referencePluckIndex = uint8(condition.compValue[0]);
            if ((visited & (1 << referencePluckIndex)) == 0) {
                revert IRolesError.PluckNotVisitedBeforeRef(
                    index,
                    referencePluckIndex
                );
            }

            uint8 relativePluckIndex = uint8(condition.compValue[2]);
            if ((visited & (1 << relativePluckIndex)) == 0) {
                revert IRolesError.PluckNotVisitedBeforeRef(
                    index,
                    relativePluckIndex
                );
            }
        }

        if (
            condition.operator == Operator.ZipSome ||
            condition.operator == Operator.ZipEvery
        ) {
            for (uint256 k; k < condition.compValue.length; ++k) {
                uint8 pluckIndex = uint8(condition.compValue[k]);
                if ((visited & (1 << pluckIndex)) == 0) {
                    revert IRolesError.PluckNotVisitedBeforeRef(
                        index,
                        pluckIndex
                    );
                }
            }
        }

        (uint256 childStart, uint256 childCount) = Topology.childBounds(
            conditions,
            index
        );

        for (uint256 i = 0; i < childCount; ++i) {
            visited = _validatePluckOrder(conditions, childStart + i, visited);
        }

        return visited;
    }

    function _validateNoPluckDescendant(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure {
        if (conditions[index].operator == Operator.Pluck) {
            revert IRolesError.UnsupportedOperator(index);
        }
        (uint256 childStart, uint256 childCount) = Topology.childBounds(
            conditions,
            index
        );
        for (uint256 i = 0; i < childCount; ++i) {
            _validateNoPluckDescendant(conditions, childStart + i);
        }
    }

    function _sChildBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    )
        private
        pure
        returns (uint256 childStart, uint256 childCount, uint256 sChildCount)
    {
        (childStart, childCount) = Topology.childBounds(conditions, index);
        for (uint256 i; i < childCount; ++i) {
            if (TypeTree.hash(conditions, childStart + i) != 0) {
                ++sChildCount;
            }
        }
    }

    /**
     * @notice Checks if two layouts are type-compatible: either exact type
     *         hash match, or type equivalence (both resolve to Dynamic or
     *         AbiEncoded).
     */
    function _isTypeCompatible(
        Layout memory a,
        Layout memory b
    ) private pure returns (bool) {
        bytes32 hashA = TypeTree.hash(a);
        assert(hashA != 0);

        bytes32 hashB = TypeTree.hash(b);
        assert(hashB != 0);

        if (hashA == hashB) {
            return true;
        }
        return _isDynamicish(a) && _isDynamicish(b);
    }

    /**
     * @notice Finds the conditions index of the Pluck condition with the given
     *         pluck index.
     */
    function _findPluckedArray(
        ConditionFlat[] memory conditions,
        uint8 pluckIndex
    ) private pure returns (bool found, uint256 conditionIndex) {
        for (uint256 i = 0; i < conditions.length; ++i) {
            if (
                conditions[i].operator == Operator.Pluck &&
                uint8(conditions[i].compValue[0]) == pluckIndex
            ) {
                return (true, i);
            }
        }
    }

    function _isDynamicish(Layout memory layout) private pure returns (bool) {
        /*
         * None on a resolved type tree means a Variant placeholder. Such
         * fields equate to Dynamic
         */
        return
            layout.encoding == Encoding.Dynamic ||
            layout.encoding == Encoding.AbiEncoded ||
            layout.encoding == Encoding.None;
    }
}
