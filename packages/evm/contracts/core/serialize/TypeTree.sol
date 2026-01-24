// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title  TypeTree
 * @notice Extracts type trees from flat conditions for use in decoding.
 *         Variants can appear in logical or array nodes and must be handled.
 *         See inline comments for rules
 *
 * @author gnosisguild
 */
library TypeTree {
    /**
     * @notice Extracts type tree for flat node at index
     */
    function inspect(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (Layout memory node) {
        bool isLogical = _isLogical(conditions, index);
        bool variant = isVariant(conditions, index);

        /*
         * Type trees only include structural children
         */
        (uint256 childStart, , uint256 sChildCount) = childBounds(
            conditions,
            index
        );

        /*
         * Non-variant logical nodes: first child defines the type tree,
         * others have the same structure and don't influence the result
         */
        if (isLogical && !variant) {
            return inspect(conditions, childStart);
        }

        /*
         * Nodes that are Logical and Variant use Dynamic as a container to
         * indicate the variant. All other nodes use their declared paramType
         */
        node.encoding = (isLogical && variant)
            ? Encoding.Dynamic
            : conditions[index].paramType;

        /*
         * For non-variant arrays, the first child serves as a template for
         * all elements. For all other nodes, traverse all structural children
         */
        node.children = new Layout[](
            node.encoding == Encoding.Array && !variant ? 1 : sChildCount
        );

        for (uint256 i = 0; i < node.children.length; ++i) {
            node.children[i] = inspect(conditions, childStart + i);
        }

        node.inlined = isInlined(conditions, index);
    }

    /**
     * @notice Computes a unique hash for a type tree structure
     */
    function id(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bytes32) {
        return hashTree(inspect(conditions, index));
    }

    /**
     * @notice Computes a unique hash for a Layout tree
     */
    function hashTree(Layout memory tree) internal pure returns (bytes32) {
        if (tree.children.length == 0) {
            return bytes32(uint256(tree.encoding));
        }

        bytes32[] memory childHashes = new bytes32[](tree.children.length);
        for (uint256 i = 0; i < tree.children.length; i++) {
            childHashes[i] = hashTree(tree.children[i]);
        }

        return
            keccak256(
                abi.encodePacked(bytes32(uint256(tree.encoding)), childHashes)
            );
    }

    /**
     * @notice Gets the bounds and counts of children for a given node
     * @param conditions The flat array of conditions
     * @param index The index of the parent node
     *
     * @return childStart The index of the first child (0 if no children)
     * @return childCount The total number of children (structural + non-structural)
     * @return sChildCount The number of structural children only
     */
    function childBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    )
        internal
        pure
        returns (uint256 childStart, uint256 childCount, uint256 sChildCount)
    {
        uint256 len = conditions.length;

        for (uint256 i = index + 1; i < len; ++i) {
            uint256 parent = conditions[i].parent;

            if (parent == index) {
                if (childCount == 0) childStart = i;
                ++childCount;

                // Count structural children
                if (isStructural(conditions, i)) {
                    ++sChildCount;
                }
            } else if (parent > index) {
                break;
            }
        }
    }

    /**
     * @notice Checks if a node is a variant (children have different type trees)
     */
    function isVariant(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bool) {
        bool isArray = conditions[index].paramType == Encoding.Array;
        bool isLogical = _isLogical(conditions, index);

        if (!isArray && !isLogical) {
            return false;
        }

        (uint256 childStart, , uint256 sChildCount) = childBounds(
            conditions,
            index
        );
        if (sChildCount <= 1) return false;

        bytes32 idHash = id(conditions, childStart);
        for (uint256 i = 1; i < sChildCount; ++i) {
            if (idHash != id(conditions, childStart + i)) return true;
        }

        return false;
    }

    /**
     * @notice Determines if a node is structural
     * @dev A node is structural if it has paramType != None OR any descendant has paramType != None
     */
    function isStructural(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bool) {
        // EtherValue is an alias for None
        Encoding encoding = conditions[index].paramType;
        if (encoding != Encoding.None && encoding != Encoding.EtherValue) {
            return true;
        }

        // Check all direct children
        for (uint256 i = index + 1; i < conditions.length; ++i) {
            uint256 parent = conditions[i].parent;
            if (parent == index) {
                // Recursively check if child is structural
                if (isStructural(conditions, i)) {
                    return true;
                }
            } else if (parent > index) {
                break;
            }
        }

        return false;
    }

    /**
     * @notice Resolves through transparent (non-variant) And/Or chains to find actual encoding
     */
    function resolvesTo(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (Encoding) {
        while (
            conditions[index].paramType == Encoding.None ||
            conditions[index].paramType == Encoding.EtherValue
        ) {
            (uint256 childStart, , ) = childBounds(conditions, index);
            index = childStart;
        }

        return conditions[index].paramType;
    }

    function _isLogical(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        return
            conditions[index].operator == Operator.And ||
            conditions[index].operator == Operator.Or;
    }

    function isInlined(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bool) {
        Encoding encoding = conditions[index].paramType;
        if (
            encoding == Encoding.Dynamic ||
            encoding == Encoding.Array ||
            encoding == Encoding.AbiEncoded
        ) {
            return false;
        }

        for (uint256 i = index + 1; i < conditions.length; ++i) {
            uint256 parent = conditions[i].parent;
            if (parent == index && !isInlined(conditions, i)) {
                return false;
            } else if (parent > index) {
                break;
            }
        }
        return true;
    }
}
