// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title  Topology
 * @notice Library for analyzing the structure of flat condition trees
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
}
