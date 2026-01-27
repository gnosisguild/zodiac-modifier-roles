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
     * @dev Gets the locations of all direct children for Tuple/Array/AbiEncoded.
     *      Returns overflow=true if calldata bounds are exceeded.
     */
    function children(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256[] memory empty, bool overflow) {
        Encoding enc = condition.encoding;

        bool isArray = enc == Encoding.Array;
        uint256 childCount;

        if (isArray) {
            if (location + 32 > data.length) {
                return (empty, true);
            }
            childCount = uint256(bytes32(data[location:]));
            location += 32;
        } else {
            childCount = condition.children.length;
        }

        uint256[] memory result = new uint256[](childCount);

        uint256 headOffset;
        for (uint256 i; i < childCount; ++i) {
            Condition memory child = condition.children[isArray ? 0 : i];

            if (child.inlined) {
                result[i] = location + headOffset;
                headOffset += child.size;
            } else {
                if (location + headOffset + 32 > data.length) {
                    return (empty, true);
                }

                result[i] =
                    location +
                    uint256(uint256(bytes32(data[location + headOffset:])));
                headOffset += 32;
            }
        }
        return (result, false);
    }

    /**
     * @dev Computes the encoded size of a value at location.
     *      Returns 0 on overflow (caller should check bounds separately).
     */
    function size(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256 result) {
        Encoding enc = condition.encoding;

        // Static is always 32 bytes
        if (enc == Encoding.Static) {
            return 32;
        }

        /*
         * About Encoding.AbiEncoded
         *
         * AbiEncoded types are wrapped in dynamic 'bytes'. ConditionEvaluation logic
         * skips the 32-byte length prefix. Thus, calling size on a *root* AbiEncoded
         * fails, as it expects the prefix. This is intentional: AbiEncoded do not
         * support 'EqualTo', only 'Matches'. On traversal, we patch the location
         * because we make no distinction between top-level and nested types on
         * the condition side.
         *
         * TLDR: you can call size on nested AbiEncoded, but not on root ones
         */
        if (enc == Encoding.Dynamic || enc == Encoding.AbiEncoded) {
            // Dynamic types: length prefix + padded content
            if (location + 32 > data.length) return 0;
            return 32 + _ceil32(uint256(bytes32(data[location:])));
        }

        if (enc == Encoding.None) {
            // Transparent And/Or: delegate to first child
            for (uint256 i; i < condition.children.length; i++) {
                result = size(data, location, condition.children[i]);
                if (result > 0) return result;
            }
            return 0;
        }

        /*
         * Tuple or Array
         */
        bool isArray = enc == Encoding.Array;
        uint256 childCount;
        if (isArray) {
            if (location + 32 > data.length) return 0;
            childCount = uint256(bytes32(data[location:]));
            location += 32;
            result = 32;
        } else {
            childCount = condition.children.length;
        }

        /*
         * HEAD + TAIL block encoding
         *
         * Process the HEAD region. ABI encoding stores static elements inline and
         * dynamic elements as 32-byte offsets to the TAIL region. We sum the
         * HEAD footprint (element size or offset) and recursive TAIL sizes.
         */
        uint256 headOffset;
        for (uint256 i; i < childCount; ++i) {
            Condition memory child = condition.children[isArray ? 0 : i];

            uint256 sizeAtHead;
            uint256 sizeAtTail;
            if (child.inlined) {
                sizeAtHead = child.size;
                sizeAtTail = 0;
            } else {
                if (location + headOffset + 32 > data.length) return 0;
                uint256 tailOffset = uint256(
                    bytes32(data[location + headOffset:])
                );
                sizeAtHead = 32;
                sizeAtTail = size(data, location + tailOffset, child);

                if (sizeAtTail == 0) return 0;
            }

            result += sizeAtHead + sizeAtTail;
            headOffset += sizeAtHead;
        }
    }

    function _ceil32(uint256 x) private pure returns (uint256) {
        return (x + 31) & ~uint256(31);
    }
}
