// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Types.sol";

/**
 * @title  Topology - a library that provides helper functions for dealing with
 * the flat representation of conditions.
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
        node._type = conditions[index].paramType;

        uint256[] memory children = _findChildren(conditions, index);
        if (children.length == 0) return node;

        Operator op = conditions[index].operator;

        // Logical operators (And, Or, Nor) have special handling
        if (_isLogical(op)) {
            return _buildLogicalTree(conditions, children);
        }

        // Arrays: check if children are variant (different types)
        if (node._type == AbiType.Array) {
            bool isVariant = _hasVariantChildren(conditions, children);
            node.children = new TypeTree[](isVariant ? children.length : 1);
        } else {
            node.children = new TypeTree[](children.length);
        }

        // Build children recursively
        for (uint256 i = 0; i < node.children.length; i++) {
            node.children[i] = typeTree(conditions, children[i]);
        }
        return node;
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

    function childBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (uint256 start, uint256 length) {
        uint256 len = conditions.length;
        unchecked {
            for (uint256 i = index + 1; i < len; ++i) {
                uint256 parent = conditions[i].parent;

                if (parent == index) {
                    if (length == 0) start = i;
                    ++length;
                } else if (parent > index) {
                    break;
                }
            }
        }
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    function _findChildren(
        ConditionFlat[] memory conditions,
        uint256 parentIndex
    ) private pure returns (uint256[] memory children) {
        // Count total direct children (upper bound)
        uint256 maxCount;
        for (uint256 i = parentIndex + 1; i < conditions.length; i++) {
            if (conditions[i].parent == parentIndex) {
                maxCount++;
            } else if (conditions[i].parent > parentIndex) {
                break;
            }
        }

        // Allocate array at max size and fill with structural children only
        children = new uint256[](maxCount);
        uint256 actualCount;
        for (uint256 i = parentIndex + 1; i < conditions.length; i++) {
            if (conditions[i].parent == parentIndex) {
                if (!_isNonStructural(conditions, i)) {
                    children[actualCount++] = i;
                }
            } else if (conditions[i].parent > parentIndex) {
                break;
            }
        }

        // Patch array length to actual count
        assembly {
            mstore(children, actualCount)
        }
    }

    function _isLogical(Operator op) private pure returns (bool) {
        return op >= Operator.And && op <= Operator.Nor;
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
        for (uint256 i = index + 1; i < conditions.length; i++) {
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

    function _buildLogicalTree(
        ConditionFlat[] memory conditions,
        uint256[] memory children
    ) private pure returns (TypeTree memory node) {
        // If all children same type, collapse to single child
        if (!_hasVariantChildren(conditions, children)) {
            return typeTree(conditions, children[0]);
        }

        // Variant children: wrap in Dynamic type
        node._type = AbiType.Dynamic;
        node.children = new TypeTree[](children.length);
        for (uint256 i = 0; i < children.length; i++) {
            node.children[i] = typeTree(conditions, children[i]);
        }
        return node;
    }

    function _hasVariantChildren(
        ConditionFlat[] memory conditions,
        uint256[] memory children
    ) private pure returns (bool) {
        if (children.length <= 1) return false;

        bytes32 id = typeTreeId(conditions, children[0]);
        for (uint256 i = 1; i < children.length; ++i) {
            if (id != typeTreeId(conditions, children[i])) return true;
        }

        return false;
    }

    function _hashTree(TypeTree memory tree) private pure returns (bytes32) {
        // NonStructural nodes (None type with only None descendants) return zero hash
        if (tree._type == AbiType.None && _allChildrenNone(tree)) {
            return bytes32(0);
        }

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

    function _allChildrenNone(
        TypeTree memory tree
    ) private pure returns (bool) {
        for (uint256 i = 0; i < tree.children.length; i++) {
            if (tree.children[i]._type != AbiType.None) {
                return false;
            }
            // Recursively check descendants
            if (!_allChildrenNone(tree.children[i])) {
                return false;
            }
        }
        return true;
    }
}
