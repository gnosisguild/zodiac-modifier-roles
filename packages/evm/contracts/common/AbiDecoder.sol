// SPDX-License-Identifier: LGPL-3.0
pragma solidity >=0.8.21 <0.9.0;

import {Encoding, Layout, Payload} from "../types/Condition.sol";
import {IRolesError} from "../types/RolesError.sol";

/**
 * @title AbiDecoder - Inspects calldata and determines parameter locations
 *
 * @author gnosisguild
 *
 * @notice This library inspects ABI-encoded calldata according to type Layout
 *         definition, producing Payload mappings that describe where each
 *         parameter resides in calldata and how large it is.
 *
 *         The decoder performs strict bounds validation but does NOT extract
 *         or interpret actual parameter values. It only identifies WHERE each
 *         parameter is located, not WHAT it contains.
 *
 *         This mapping is subsequently consumed by the PermissionChecker,
 *         which leverages it for cheap calldata slicing.
 */
library AbiDecoder {
    /**
     * @dev Maps the location and size of a parameter in calldata according to
     *      a Layout.
     *
     * @param data      The encoded transaction data to be inspected.
     * @param layout    The Layout defining the type structure.
     * @return payload  The mapped location and size of parameters in the encoded
     *                  transaction data.
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
     * @dev Walks through a parameter encoding tree and maps their location
     *      and size within calldata.
     *
     * @param data     The encoded transaction data.
     * @param location The current absolute position within calldata.
     * @param layout   The layout node
     * @param payload  The output payload containing the parameter's location
     *                 and size in calldata.
     */
    function _walk(
        bytes calldata data,
        uint256 location,
        Layout memory layout,
        Payload memory payload
    ) private pure {
        assert(location + 32 <= data.length);

        payload.typeIndex = layout.index;

        Encoding encoding = layout.encoding;
        if (encoding == Encoding.Static) {
            payload.size = 32;
        } else if (encoding == Encoding.Dynamic) {
            if (layout.children.length > 0) {
                _variant(data, location, layout, payload);
            }
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
        } else {
            assert(encoding == Encoding.AbiEncoded);
            __block__(
                data,
                location + 32 + layout.leadingBytes,
                layout.children.length,
                layout,
                payload
            );
            payload.size = 32 + _ceil32(uint256(word(data, location)));
        }

        if (location + payload.size > data.length) {
            payload.overflown = true;
        }
        payload.location = location;
    }

    /**
     * @dev Decodes a block of parameters from calldata, handling both Arrays
     *      and Tuples which use the HEAD+TAIL encoding scheme.
     *
     * @param data      The encoded transaction data
     * @param location  Starting byte position of the block in calldata
     * @param length    Number of elements to decode in this block
     * @param layout  Type definition tree for this block
     * @param payload   Output payload to populate with decoded data
     *
     * @notice Key differences:
     *        - Arrays: All elements share the same type (layout.children[0])
     *        - Tuples: Each element has its own type (layout.children[i])
     *        - Inline elements are stored directly in HEAD region
     *        - Non-inline elements store a pointer in HEAD, data in TAIL
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
        uint256 offset;
        for (uint256 i; i < length; ++i) {
            Payload memory child = children[i];
            Layout memory typeChild = layout.children[
                isArray && i >= layout.children.length ? 0 : i
            ];

            bool isInline = _isInline(typeChild);

            uint256 childLocation = _locationInBlock(
                data,
                location,
                offset,
                isInline
            );

            if (childLocation == type(uint256).max) {
                payload.overflown = true;
                return;
            }

            _walk(data, childLocation, typeChild, child);

            if (child.overflown) {
                payload.overflown = true;
                return;
            }

            // Update the offset in the block for the next element
            offset += isInline ? child.size : 32;

            // For non-inline elements, we need to account for the 32-byte pointer
            payload.size += child.size + (isInline ? 0 : 32);
        }
        payload.children = children;
    }

    /**
     * @dev Handles variant nodes where multiple type interpretations are possible
     *      for the same data location. Used by Dynamic nodes with variant children.
     *
     * @param data      The encoded transaction data
     * @param location  Starting byte position in calldata
     * @param layout    Type node containing variant interpretations as children
     * @param payload   Output payload marked as variant with child payloads
     *
     * @notice The payload is marked as overflown=true by default. It's only set
     *         to false if at least one variant interpretation succeeds (doesn't
     *         overflow).
     */
    function _variant(
        bytes calldata data,
        uint256 location,
        Layout memory layout,
        Payload memory payload
    ) private pure {
        uint256 length = layout.children.length;

        payload.variant = true;
        payload.overflown = true;
        payload.children = new Payload[](length);

        unchecked {
            for (uint256 i; i < length; ++i) {
                _walk(data, location, layout.children[i], payload.children[i]);
                payload.overflown =
                    payload.overflown &&
                    payload.children[i].overflown;
            }
        }
    }

    /**
     * @dev Resolves the absolute position of a block element in calldata based
     *      on HEAD+TAIL encoding. Part of __block__ processing for Arrays/Tuples.
     *
     * @param data       The encoded calldata
     * @param location   Start of this block's HEAD region
     * @param headOffset Offset of current element within block's HEAD
     * @param isInline   True if element stored inline in HEAD, false if in TAIL
     * @return           Absolute position in calldata, or type(uint256).max if
     *                   bounds are violated (overflow detected)
     *
     * @notice Block encoding rules:
     *         - Inline elements: stored directly at location + headOffset
     *         - Dynamic elements: HEAD contains pointer, data in TAIL region
     *         - TAIL offsets are relative to block start, not calldata start
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
     * @dev Determines if a parameter is stored inline (in HEAD region) versus
     *      offset pointing to TAIL region.
     *
     * @param layout The layout node to check
     * @return       `true` if inline, `false` if requires pointer
     *
     * @notice Inline types:
     *         - Static: always inline (32 bytes)
     *         - Tuple: inline if ALL fields are inline
     *
     *         Non-inline types (require pointer):
     *         - Dynamic: variable length data
     *         - Array: length prefix + elements
     *         - AbiEncoded: embedded structures
     */
    function _isInline(Layout memory layout) private pure returns (bool) {
        Encoding encoding = layout.encoding;
        if (encoding == Encoding.Static) {
            return true;
        } else if (encoding == Encoding.Dynamic || encoding >= Encoding.Array) {
            return false;
        } else {
            uint256 length = layout.children.length;
            for (uint256 i; i < length; ) {
                if (!_isInline(layout.children[i])) {
                    return false;
                }
                unchecked {
                    ++i;
                }
            }
            return true;
        }
    }

    /**
     * @dev Loads a word from calldata.
     * @param data The calldata to load the word from.
     * @param location The starting location of the slice.
     * @return result 32 byte word from calldata.
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
        return ((size + 32 - 1) / 32) * 32;
    }
}
