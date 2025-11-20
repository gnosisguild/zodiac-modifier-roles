// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Types.sol";

/**
 * @title  Topology
 *
 * @author gnosisguild
 *
 */
library Topology {
    /**
     * @notice Builds a TypeTree from flat conditions starting at index
     */
    function typeTree(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (TypeTree memory node) {
        bool isLogical = _isLogical(conditions, index);
        bool isVariant = _isVariant(conditions, index);
        (uint256 childStart, uint256 childLength) = _structuralChildBounds(
            conditions,
            index
        );

        if (isLogical && isVariant == false) {
            return typeTree(conditions, childStart);
        }

        /*
         * if its logical, then it's variant, because we returned on variant false
         * in that case, we represent Variants by a Dynamic type with children
         */
        node._type = isLogical ? AbiType.Dynamic : conditions[index].paramType;
        /*
         * We traver and establish children. Except for non variant arrays, where
         * we just take the first element as Template
         */
        node.children = new TypeTree[](
            node._type == AbiType.Array && isVariant == false ? 1 : childLength
        );
        for (uint256 i = 0; i < node.children.length; ++i) {
            node.children[i] = typeTree(conditions, childStart + i);
        }
    }

    /**
     * @notice Computes a unique hash for a type tree structure
     */
    function typeTreeId(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bytes32) {
        return _hashTree(typeTree(conditions, index));
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================
    function _hashTree(TypeTree memory tree) private pure returns (bytes32) {
        if (tree.children.length == 0) {
            return bytes32(uint256(tree._type));
        }

        bytes32[] memory childHashes = new bytes32[](tree.children.length);
        for (uint256 i = 0; i < tree.children.length; i++) {
            childHashes[i] = _hashTree(tree.children[i]);
        }

        return
            keccak256(
                abi.encodePacked(bytes32(uint256(tree._type)), childHashes)
            );
    }

    function _isLogical(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        return
            conditions[index].operator == Operator.And ||
            conditions[index].operator == Operator.Or;
    }

    function _isVariant(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        if (
            !_isLogical(conditions, index) &&
            conditions[index].paramType != AbiType.Array
        ) {
            return false;
        }

        (uint256 childStart, uint256 childLength) = _structuralChildBounds(
            conditions,
            index
        );
        if (childLength <= 1) return false;

        bytes32 id = typeTreeId(conditions, childStart);
        for (uint256 i = 1; i < childLength; ++i) {
            if (id != typeTreeId(conditions, childStart + i)) return true;
        }

        return false;
    }

    function _isNonStructural(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        // NonStructural if paramType is None and all descendants are None
        if (conditions[index].paramType != AbiType.None) {
            return false;
        }

        // Check all direct children
        for (uint256 i = index + 1; i < conditions.length; ++i) {
            if (conditions[i].parent == index) {
                // Recursively check if child is nonStructural
                if (!_isNonStructural(conditions, i)) {
                    return false;
                }
            } else if (conditions[i].parent > index) {
                break;
            }
        }

        return true;
    }

    function _structuralChildBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (uint256 start, uint256 length) {
        for (uint256 i = index + 1; i < conditions.length; ++i) {
            uint256 parent = conditions[i].parent;

            if (parent == index) {
                // non structural nodes and sub trees come last
                if (_isNonStructural(conditions, i)) break;
                if (length == 0) start = i;

                ++length;
            } else if (parent > index) {
                break;
            }
        }
    }
}
