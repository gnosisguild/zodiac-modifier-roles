// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title  Topology
 * @notice Utilities for navigating flat condition tree structure.
 *
 * @author gnosisguild
 */
library Topology {
    /**
     * @notice Gets the bounds and counts of children for a given node
     * @param conditions The flat array of conditions
     * @param index The index of the parent node
     *
     * @return childStart The index of the first child (0 if no children)
     * @return childCount The total number of children
     */
    function childBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (uint256 childStart, uint256 childCount) {
        uint256 len = conditions.length;

        for (uint256 i = index + 1; i < len; ++i) {
            uint256 parent = conditions[i].parent;

            if (parent == index) {
                if (childCount == 0) childStart = i;
                ++childCount;
            } else if (parent > index) {
                break;
            }
        }
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

        // Check if any child is structural
        (uint256 childStart, uint256 childCount) = childBounds(
            conditions,
            index
        );
        for (uint256 i; i < childCount; ++i) {
            if (isStructural(conditions, childStart + i)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Checks if a node is inlined (all descendants are static)
     */
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

        (uint256 childStart, uint256 childCount) = childBounds(
            conditions,
            index
        );
        for (uint256 i; i < childCount; ++i) {
            if (!isInlined(conditions, childStart + i)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @notice Computes inlined size for a node (0 if not inlined)
     */
    function inlinedSize(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (uint256 size) {
        // Precondition: only called for inlined nodes
        assert(isInlined(conditions, index) == true);

        Encoding encoding = conditions[index].paramType;

        if (encoding == Encoding.Static) {
            return 32;
        }

        /*
         * Remaining encodings:
         * - Tuple: sum of all children sizes
         * - None: transparent, delegates to first structural child
         */
        (uint256 childStart, uint256 childCount) = childBounds(
            conditions,
            index
        );

        for (uint256 i; i < childCount; ++i) {
            uint256 childSize = inlinedSize(conditions, childStart + i);
            /*
             * None nodes are transparent wrappers (And/Or or non-structural).
             * Since inlined nodes can't have variants, all structural children
             * share the same size. Return on first non-zero (structural) child.
             */
            if (encoding == Encoding.None) return childSize;
            size += childSize;
        }
        return size;
    }
}
