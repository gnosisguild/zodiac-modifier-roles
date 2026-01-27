// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Condition, Encoding} from "../types/Condition.sol";
import {Operator} from "../types/Operator.sol";

/**
 * @title AbiLocation - Locates ABI-encoded parameters on-demand
 * @author gnosisguild
 */
library AbiLocation {
    uint256 private constant _OVERFLOW = type(uint256).max;

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
                uint256 childLocation = _tailLocation(
                    data,
                    location,
                    headOffset
                );
                if (childLocation == _OVERFLOW) return (empty, true);

                result[i] = childLocation;
                headOffset += 32;
            }
        }
        return (result, false);
    }

    /**
     * @dev Computes the encoded size of a value at location.
     *      Returns overflow=true if calldata bounds are exceeded.
     */
    function size(
        bytes calldata data,
        uint256 location,
        Condition memory condition
    ) internal pure returns (uint256 result, bool overflow) {
        Encoding enc = condition.encoding;

        // Static is always 32 bytes
        if (enc == Encoding.Static) {
            return (32, false);
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
            if (location + 32 > data.length) return (0, true);
            return (32 + _ceil32(uint256(bytes32(data[location:]))), false);
        }

        if (enc == Encoding.None) {
            // Transparent And/Or: delegate to first child
            for (uint256 i; i < condition.children.length; i++) {
                (result, overflow) = size(
                    data,
                    location,
                    condition.children[i]
                );
                if (!overflow && result > 0) return (result, false);
            }
            return (0, true);
        }

        /*
         * Tuple or Array
         */
        bool isArray = enc == Encoding.Array;
        uint256 childCount;
        if (isArray) {
            if (location + 32 > data.length) return (0, true);
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
                uint256 childLocation = _tailLocation(
                    data,
                    location,
                    headOffset
                );
                if (childLocation == _OVERFLOW) return (0, true);

                sizeAtHead = 32;
                (sizeAtTail, overflow) = size(data, childLocation, child);

                if (overflow) return (0, true);
            }

            result += sizeAtHead + sizeAtTail;
            headOffset += sizeAtHead;
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
        if (location + headOffset + 32 > data.length) {
            return type(uint256).max;
        }

        uint256 tailOffset;
        assembly {
            tailOffset := calldataload(
                add(data.offset, add(location, headOffset))
            )
        }

        if (tailOffset <= headOffset) {
            return type(uint256).max;
        }

        if (location + tailOffset + 32 > data.length) {
            return type(uint256).max;
        }

        return location + tailOffset;
    }

    function _ceil32(uint256 x) private pure returns (uint256) {
        return (x + 31) & ~uint256(31);
    }
}
