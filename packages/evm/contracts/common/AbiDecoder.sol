// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Condition, Encoding, Payload} from "../types/Condition.sol";
import {Operator} from "../types/Operator.sol";

/**
 * @title AbiDecoder - Decodes ABI-encoded parameters on-demand
 *
 * @author gnosisguild
 *
 * @notice Provides on-demand decoding of ABI-encoded calldata.
 *         Given a location and layout template, computes child locations or size.
 */
library AbiDecoder {
    /**
     * @dev Gets the locations of all direct children.
     * @param data      The calldata being inspected.
     * @param location  Byte position of this node in calldata.
     * @param condition The condition with layout and children info.
     * @return childLocations Array of child locations, or empty if overflow.
     * @return overflow Whether decoding overflowed.
     */
    function getChildLocations(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256[] memory childLocations, bool overflow) {
        Encoding enc = condition.payload.encoding;

        // Static and Dynamic don't have children
        if (enc == Encoding.Static || enc == Encoding.Dynamic) {
            return (childLocations, false);
        }

        uint256 childCount;
        bool isArray;

        if (enc == Encoding.Array) {
            // Array: read length from data, skip 32 bytes
            if (location + 32 > data.length) {
                return (childLocations, true);
            }
            childCount = uint256(word(data, location));
            location += 32;
            isArray = true;
        } else if (enc == Encoding.Tuple || enc == Encoding.AbiEncoded) {
            childCount = condition.children.length;
        } else {
            // None, EtherValue - no children
            return (childLocations, false);
        }

        if (childCount == 0) {
            return (childLocations, false);
        }

        childLocations = new uint256[](childCount);
        uint256 headOffset;

        for (uint256 i; i < childCount; ++i) {
            Condition memory child = condition.children[isArray ? 0 : i];

            uint256 childLoc;
            if (child.payload.inlined) {
                childLoc = location + headOffset;
                headOffset += getSize(data, childLoc, child);
            } else {
                // Read pointer from head, follow to data
                childLoc =
                    location +
                    uint256(word(data, location + headOffset));
                headOffset += 32;
            }

            childLocations[i] = childLoc;
        }

        return (childLocations, false);
    }

    /**
     * @dev Computes the size of data at a location.
     *      For containers (Tuple, Array), returns the complete encoded size
     *      including both head (pointers) and tail (actual data) regions.
     */
    function getSize(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256) {
        Payload memory payload = condition.payload;
        Encoding enc = payload.encoding;

        // Non-variant logical operators (And/Or with encoding=None but children.length>0)
        // are transparent - use first child's size since all children have same type
        if (enc == Encoding.None && condition.children.length > 0) {
            return getSize(data, location, condition.children[0]);
        }

        if (enc == Encoding.Static) {
            return 32;
        } else if (enc == Encoding.Dynamic) {
            if (location + 32 > data.length) return 0;
            return 32 + _ceil32(uint256(word(data, location)));
        } else if (enc == Encoding.Tuple) {
            uint256 total;
            (uint256[] memory childLocs, bool overflow) = getChildLocations(
                data,
                location,
                condition
            );
            if (overflow) return 0;

            for (uint256 i; i < childLocs.length; ++i) {
                Condition memory child = condition.children[i];
                uint256 childSize = getSize(data, childLocs[i], child);
                // Inlined: data is in head, count its size
                // Not inlined: 32-byte pointer in head + data in tail
                total += child.payload.inlined ? childSize : 32 + childSize;
            }
            return total;
        } else if (enc == Encoding.Array) {
            if (location + 32 > data.length) return 0;
            (uint256[] memory childLocs, bool overflow) = getChildLocations(
                data,
                location,
                condition
            );
            if (overflow) return 0;

            uint256 total = 32; // length field
            Condition memory child = condition.children[0];
            for (uint256 i; i < childLocs.length; ++i) {
                uint256 childSize = getSize(data, childLocs[i], child);
                // Inlined: data is in head, count its size
                // Not inlined: 32-byte pointer in head + data in tail
                total += child.payload.inlined ? childSize : 32 + childSize;
            }
            return total;
        } else if (enc == Encoding.AbiEncoded) {
            if (location + 32 > data.length) return 0;
            return 32 + _ceil32(uint256(word(data, location)));
        }

        return 0;
    }

    /**
     * @dev Loads a 32-byte word from calldata.
     *
     * @param data     The calldata being inspected.
     * @param location The byte offset to read from.
     * @return result  The 32-byte word at location.
     */
    function word(
        bytes calldata data,
        uint256 location
    ) internal pure returns (bytes32 result) {
        assembly {
            result := calldataload(add(data.offset, location))
        }
    }

    /**
     * @dev Calculates the ceiling of a number to the nearest multiple of 32
     */
    function _ceil32(uint256 size) private pure returns (uint256) {
        // pad size. Source: http://www.cs.nott.ac.uk/~psarb2/G51MPC/slides/NumberLogic.pdf
        //return ((size + 32 - 1) / 32) * 32;
        return (size + 31) & ~uint256(31);
    }
}
