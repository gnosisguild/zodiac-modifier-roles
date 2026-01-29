// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Condition, Encoding} from "../types/Condition.sol";
import {Operator} from "../types/Operator.sol";

/**
 * @title AbiLocation - Locates ABI-encoded parameters on-demand
 * @author gnosisguild
 */
library AbiLocation {
    /**
     * @dev Resolves absolute calldata locations for direct children of a
     *      container. Supports Tuple, Array, and AbiEncoded types.
     *
     * @param data      The calldata buffer being inspected.
     * @param location  The absolute start position of the container block.
     *
     */
    function children(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256[] memory none, bool overflow) {
        uint256 childCount = condition.children.length;

        bool isArray = condition.encoding == Encoding.Array;
        if (isArray) {
            if (location + 32 > data.length) return (none, true);
            assembly {
                childCount := calldataload(add(data.offset, location))
            }
            location += 32;
        }

        uint256[] memory result = new uint256[](childCount);

        uint256 headOffset;
        for (uint256 i; i < childCount; ++i) {
            Condition memory child = condition.children[isArray ? 0 : i];

            if (child.inlined) {
                result[i] = location + headOffset;
                headOffset += child.size;
            } else {
                result[i] = _tailLocation(data, location, headOffset);
                headOffset += 32;
            }

            if (result[i] > data.length) {
                return (none, true);
            }
        }
        return (result, false);
    }

    /**
     * @dev Computes the encoded size of a value at location.
     */
    function size(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256 result) {
        Encoding encoding = condition.encoding;

        if (encoding == Encoding.Static) {
            return 32;
        }

        /*
         * Read first word, detect overflow
         */
        if (location + 32 > data.length) return data.length + 1;
        uint256 word;
        assembly {
            word := calldataload(add(data.offset, location))
        }

        /*
         * About AbiEncoded
         *
         * AbiEncoded location is patched during ConditionEvaluation
         * so that top-level and nested AbiEncoded nodes are treated
         * uniformly by the evaluator. As a consequence, this function
         * only supports nested AbiEncoded nodes – calling it on a
         * root one would fail. This is fine because the entry point
         * for size is always via EqualTo, and AbiEncoded cannot be
         * paired with that operator.
         */
        if (encoding == Encoding.Dynamic || encoding == Encoding.AbiEncoded) {
            // Dynamic types: length prefix + padded content (ceil32)
            return 32 + ((word + 31) & ~uint256(31));
        }

        uint256 childCount = condition.children.length;
        if (encoding == Encoding.None) {
            // Transparent And/Or: delegate size to first child
            for (uint256 i; i < childCount; ++i) {
                result = size(data, location, condition.children[i]);
                // children can overflow or be non structural
                if (result > 0 && result <= data.length) return result;
            }
            // if we reached here, just mark overflow
            return data.length + 1;
        }

        /*
         * Tuple / Array
         */
        bool isArray = encoding == Encoding.Array;
        if (isArray) {
            childCount = word;
            location += 32;
            result = 32;
        }

        uint256 headOffset;
        for (uint256 i; i < childCount; ++i) {
            Condition memory child = condition.children[isArray ? 0 : i];
            /*
             * HEAD + TAIL block encoding
             *
             * Process the HEAD region. ABI encoding stores static elements
             * inline and dynamic elements as 32-byte offsets to the TAIL
             * region. We sum the HEAD footprint (element size or offset) and
             * recursive TAIL sizes.
             */
            if (child.inlined) {
                result += child.size;
                headOffset += child.size;
            } else {
                result +=
                    32 +
                    size(
                        data,
                        _tailLocation(data, location, headOffset),
                        child
                    );
                headOffset += 32;
            }
        }
    }

    /**
     * @dev Computes the absolute position of a dynamic (non-inline) element.
     *      Reads the relative offset from HEAD and adds it to the block start
     *      to locate the element in the TAIL region.
     *
     * @param data       The calldata being inspected.
     * @param location   Absolute start position of the current ABI block.
     * @param headOffset Byte offset within HEAD where the pointer resides.
     * @return           Absolute position, or type(uint256).max on overflow.
     */
    function _tailLocation(
        bytes calldata data,
        uint256 location,
        uint256 headOffset
    ) private pure returns (uint256) {
        // HEAD overflows buffer
        if (location + headOffset + 32 > data.length) {
            return data.length + 1;
        }

        uint256 tailOffset;
        assembly {
            tailOffset := calldataload(
                add(data.offset, add(location, headOffset))
            )
        }

        // TAIL points backwards
        if (tailOffset <= headOffset) {
            return data.length + 1;
        }

        // TAIL overflows buffer
        if (location + tailOffset + 32 > data.length) {
            return data.length + 1;
        }

        return location + tailOffset;
    }
}
