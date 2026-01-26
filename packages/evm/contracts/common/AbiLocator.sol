// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Condition, Encoding} from "../types/Condition.sol";
import {Operator} from "../types/Operator.sol";

/**
 * @title AbiLocator - Locates ABI-encoded parameters on-demand
 * @author gnosisguild
 */
library AbiLocator {
    /**
     * @dev Gets the locations of all direct children for Tuple/Array/AbiEncoded.
     */
    function getChildLocations(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256[] memory childLocations) {
        Encoding enc = condition.encoding;

        uint256 childCount;
        bool isArray;

        if (enc == Encoding.Array) {
            childCount = uint256(_word(data, location));
            location += 32;
            isArray = true;
        } else {
            childCount = condition.children.length;
        }

        childLocations = new uint256[](childCount);
        uint256 headOffset;

        for (uint256 i; i < childCount; ++i) {
            Condition memory child = condition.children[isArray ? 0 : i];

            if (child.inlined) {
                childLocations[i] = location + headOffset;
                headOffset += child.size;
            } else {
                childLocations[i] =
                    location +
                    uint256(_word(data, location + headOffset));
                headOffset += 32;
            }
        }
    }

    /**
     * @dev Computes the encoded size of a value at location.
     */
    function getSize(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256) {
        // Use pre-computed size if available
        if (condition.size != 0) {
            return condition.size;
        }

        Encoding enc = condition.encoding;

        // Transparent And/Or: delegate to first child
        if (enc == Encoding.None && condition.children.length > 0) {
            return getSize(data, location, condition.children[0]);
        }

        // Static is always 32 bytes
        if (enc == Encoding.Static) {
            return 32;
        }

        // Dynamic types: length prefix + padded content
        if (enc == Encoding.Dynamic || enc == Encoding.AbiEncoded) {
            return 32 + _ceil32(uint256(_word(data, location)));
        }

        // Containers: find max(childLocation + childSize) - location
        if (enc == Encoding.Tuple || enc == Encoding.Array) {
            uint256[] memory childLocations = getChildLocations(
                data,
                location,
                condition
            );
            uint256 count = childLocations.length;
            if (count == 0) {
                return 32; // Empty array: just the length prefix
            }
            uint256 maxEnd;
            for (uint256 i; i < count; ++i) {
                Condition memory child = condition.children[
                    enc == Encoding.Array ? 0 : i
                ];
                uint256 childEnd = childLocations[i] +
                    getSize(data, childLocations[i], child);
                if (childEnd > maxEnd) {
                    maxEnd = childEnd;
                }
            }
            return maxEnd - location;
        }

        return 0;
    }

    function _word(
        bytes calldata data,
        uint256 location
    ) private pure returns (bytes32 result) {
        assembly {
            result := calldataload(add(data.offset, location))
        }
    }

    function _ceil32(uint256 x) private pure returns (uint256) {
        return (x + 31) & ~uint256(31);
    }
}
