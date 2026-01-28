// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Encoding, Layout, Payload} from "../types/Condition.sol";

/**
 * @title AbiDecoder - Locates parameters within ABI-encoded calldata
 *
 * @author gnosisguild
 *
 * @notice Given ABI-encoded calldata and a type tree (Layout) describing its
 *         structure, this library produces a Payload tree that maps each
 *         parameter to its location and size (how many bytes it spans).
 *
 *         The decoder validates bounds but does NOT extract or interpret
 *         values. It only identifies WHERE parameters are, not WHAT they
 *         contain.
 *
 *         The resulting Payload is used by ConditionEvaluator for efficient
 *         calldata slicing during condition evaluation.
 */
library AbiDecoder {
    /**
     * @dev Entry point. Locates all parameters in calldata according to Layout.
     *
     * @param data     The calldata to inspect.
     * @param layout   The type tree describing the encoding structure.
     * @return payload A tree matching the encoding structure, with location
     *                 and size for each parameter.
     */
    function inspect(
        bytes calldata data,
        Layout memory layout
    ) internal pure returns (Payload memory payload) {
        assert(layout.encoding == Encoding.AbiEncoded);
        /*
         * The parameter encoding area consists of a head region, divided into
         * 32-byte chunks. Each parameter occupies one chunk in the head:
         * - Static parameters are encoded inline.
         * - Dynamic parameters store an offset pointing to the tail region, where
         *   the actual encoded data resides.
         *
         * Note: The offset is relative to the start of each block, not the start
         * of the buffer.
         */
        __block__(
            data,
            layout.leadingBytes,
            layout.children.length,
            layout,
            payload
        );
        payload.size = data.length;
    }

    /**
     * @dev Processes a sequence of elements using HEAD+TAIL encoding.
     *      Tuple, Array and AbiEncoded use this encoding type.
     *
     * @param data     The calldata being inspected.
     * @param location Byte position where the block's HEAD region starts.
     * @param length   Number of elements in the block.
     * @param layout   Type tree node for the block (Array or Tuple).
     * @param payload  Output: populated with child Payloads.
     *
     * @notice Arrays use layout.children[0] as a template for all elements.
     *         Variant arrays use layout.children[i] for each element.
     *         Tuples use layout.children[i] for each element.
     *         Static elements are encoded inline in HEAD.
     *         Dynamic elements have a pointer in HEAD, data in TAIL.
     */
    function __block__(
        bytes calldata data,
        uint256 location,
        uint256 length,
        Layout memory layout,
        Payload memory payload
    ) private pure {
        Payload[] memory children = new Payload[](length);

        bool isArray = layout.encoding == Encoding.Array;
        uint256 headOffset;
        for (uint256 i; i < length; ++i) {
            Layout memory childLayout = layout.children[
                isArray && i >= layout.children.length ? 0 : i
            ];
            Payload memory childPayload = children[i];

            bool isInline = childLayout.inlined;

            uint256 childLocation = _locationInBlock(
                data,
                location,
                headOffset,
                isInline
            );

            if (childLocation == type(uint256).max) {
                payload.overflow = true;
                return;
            }

            _walk(data, childLocation, childLayout, childPayload);

            if (childPayload.overflow) {
                payload.overflow = true;
                return;
            }

            // Update the offset in the block for the next element
            headOffset += isInline ? childPayload.size : 32;

            // For non-inline elements, we need to account for the 32-byte pointer
            payload.size += childPayload.size + (isInline ? 0 : 32);
        }
        payload.children = children;
    }

    /**
     * @dev Traverses a type tree, produces Payload with position and size.
     *
     * @param data     The calldata being inspected.
     * @param location Absolute byte position of this parameter.
     * @param layout   The type tree node to process.
     * @param payload  Output: populated with location, size, and children.
     */
    function _walk(
        bytes calldata data,
        uint256 location,
        Layout memory layout,
        Payload memory payload
    ) private pure {
        payload.location = location;
        payload.inlined = layout.inlined;

        Encoding encoding = layout.encoding;
        if (encoding == Encoding.Static) {
            payload.size = 32;
        } else if (encoding == Encoding.Dynamic) {
            payload.size = 32 + _ceil32(uint256(word(data, location)));
        } else if (encoding == Encoding.Tuple) {
            __block__(data, location, layout.children.length, layout, payload);
        } else if (encoding == Encoding.Array) {
            __block__(
                data,
                location + 32,
                uint256(word(data, location)),
                layout,
                payload
            );
            payload.size += 32;
        } else if (encoding == Encoding.AbiEncoded) {
            __block__(
                data,
                location + 32 + layout.leadingBytes,
                layout.children.length,
                layout,
                payload
            );
            payload.location = location + 32;
            payload.size = 32 + _ceil32(uint256(word(data, location)));
        } else {
            // None encoding indicates a variant (Or/And with different child types)
            assert(encoding == Encoding.None);
            uint256 length = layout.children.length;
            payload.variant = true;
            payload.overflow = true;
            payload.children = new Payload[](length);

            for (uint256 i; i < length; ++i) {
                _walk(data, location, layout.children[i], payload.children[i]);
                // overflow as a whole if all overflow
                payload.overflow =
                    payload.overflow &&
                    payload.children[i].overflow;
            }
            // variants are always encoded embedded within a Dynamic bytes,
            // this simply reads length
            payload.size = 32 + _ceil32(uint256(word(data, location)));
        }

        if (location + payload.size > data.length) {
            payload.overflow = true;
        }
    }

    /**
     * @dev Computes the absolute calldata position of an element within a block.
     *
     * @param data       The calldata being inspected.
     * @param location   Start of the block's HEAD region.
     * @param headOffset Current offset within HEAD.
     * @param isInline   Whether element is stored directly in HEAD.
     * @return           Absolute position, or type(uint256).max on overflow.
     *
     * @notice Inline elements live at location + headOffset.
     *         Non-inline elements read a pointer from HEAD that points into TAIL.
     *         TAIL offsets are relative to block start.
     */
    function _locationInBlock(
        bytes calldata data,
        uint256 location,
        uint256 headOffset,
        bool isInline
    ) private pure returns (uint256) {
        // is head within calldata
        if (location + headOffset + 32 > data.length) {
            return type(uint256).max;
        }

        if (isInline) {
            return location + headOffset;
        }

        uint256 tailOffset = uint256(word(data, location + headOffset));

        // tail points within head?
        if (tailOffset <= headOffset) {
            return type(uint256).max;
        }

        // tail points beyond calldata?
        if (location + tailOffset + 32 > data.length) {
            return type(uint256).max;
        }

        return location + tailOffset;
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
