// SPDX-License-Identifier: LGPL-3.0
pragma solidity >=0.8.21 <0.9.0;

import "./AbiTypes.sol";

/**
 * @title AbiDecoder - Inspects calldata and determines parameter locations
 *
 * @author gnosisguild
 *
 * @notice This library inspects ABI-encoded calldata according to a TypeTree
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
    error CalldataOutOfBounds();

    /**
     * @dev Maps the location and size of a parameter in calldata according to
     *      an ABI `typeTree`.
     *
     * @param data      The encoded transaction data to be inspected.
     * @param typeNode  Array of ABI type definitions forming the typeTree.
     * @return payload  The mapped location and size of parameters in the encoded
     *                  transaction data.
     */
    function inspect(
        bytes calldata data,
        TypeTree memory typeNode
    ) internal pure returns (Payload memory payload) {
        assert(
            typeNode._type == AbiType.Calldata ||
                typeNode._type == AbiType.AbiEncoded
        );
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
            typeNode._type == AbiType.Calldata ? 4 : 0,
            typeNode.children.length,
            typeNode,
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
     * @param typeNode Todo
     * @param payload  The output payload containing the parameter's location
     *                 and size in calldata.
     */
    function _walk(
        bytes calldata data,
        uint256 location,
        TypeTree memory typeNode,
        Payload memory payload
    ) private pure {
        assert(location + 32 <= data.length);

        payload.typeIndex = typeNode.index;

        AbiType _type = typeNode._type;
        if (_type == AbiType.Static) {
            payload.size = 32;
        } else if (_type == AbiType.Dynamic) {
            if (typeNode.children.length > 0) {
                _variant(data, location, typeNode, payload);
            }
            payload.size = 32 + _ceil32(uint256(word(data, location)));
        } else if (_type == AbiType.Tuple) {
            __block__(
                data,
                location,
                typeNode.children.length,
                typeNode,
                payload
            );
        } else if (_type == AbiType.Array) {
            __block__(
                data,
                location + 32,
                uint256(word(data, location)),
                typeNode,
                payload
            );
            payload.size += 32;
        } else if (_type == AbiType.Calldata || _type == AbiType.AbiEncoded) {
            __block__(
                data,
                location + 32 + (_type == AbiType.Calldata ? 4 : 0),
                typeNode.children.length,
                typeNode,
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
     * @param typeNode  Type definition tree for this block
     * @param payload   Output payload to populate with decoded data
     *
     * @notice Key differences:
     *        - Arrays: All elements share the same type (typeNode.children[0])
     *        - Tuples: Each element has its own type (typeNode.children[i])
     *        - Inline elements are stored directly in HEAD region
     *        - Non-inline elements store a pointer in HEAD, data in TAIL
     */
    function __block__(
        bytes calldata data,
        uint256 location,
        uint256 length,
        TypeTree memory typeNode,
        Payload memory payload
    ) private pure {
        Payload[] memory children = new Payload[](length);

        bool isArray = typeNode._type == AbiType.Array;
        uint256 offset;
        for (uint256 i; i < length; ++i) {
            Payload memory child = children[i];
            TypeTree memory typeChild = typeNode.children[
                isArray && i >= typeNode.children.length ? 0 : i
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
     * @param typeNode  Type node containing variant interpretations as children
     * @param payload   Output payload marked as variant with child payloads
     *
     * @notice The payload is marked as overflown=true by default. It's only set
     *         to false if at least one variant interpretation succeeds (doesn't
     *         overflow).
     */
    function _variant(
        bytes calldata data,
        uint256 location,
        TypeTree memory typeNode,
        Payload memory payload
    ) private pure {
        uint256 length = typeNode.children.length;

        payload.variant = true;
        payload.overflown = true;
        payload.children = new Payload[](length);

        unchecked {
            for (uint256 i; i < length; ++i) {
                _walk(
                    data,
                    location,
                    typeNode.children[i],
                    payload.children[i]
                );
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
     * @param node The type tree node to check
     * @return     `true` if inline, `false` if requires pointer
     *
     * @notice Inline types:
     *         - Static: always inline (32 bytes)
     *         - Tuple: inline if ALL fields are inline
     *
     *         Non-inline types (require pointer):
     *         - Dynamic: variable length data
     *         - Array: length prefix + elements
     *         - Calldata/AbiEncoded: embedded structures
     */
    function _isInline(TypeTree memory node) private pure returns (bool) {
        AbiType _type = node._type;
        if (_type == AbiType.Static) {
            return true;
        } else if (
            _type == AbiType.Dynamic ||
            _type == AbiType.Array ||
            _type == AbiType.Calldata ||
            _type == AbiType.AbiEncoded
        ) {
            return false;
        } else {
            uint256 length = node.children.length;
            for (uint256 i; i < length; ) {
                if (!_isInline(node.children[i])) {
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
     * @dev Plucks a slice of bytes from calldata.
     * @param data The calldata to pluck the slice from.
     * @param location The starting location of the slice.
     * @param size The size of the slice.
     * @return A slice of bytes from calldata.
     */
    function pluck(
        bytes calldata data,
        uint256 location,
        uint256 size
    ) internal pure returns (bytes calldata) {
        return data[location:location + size];
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
        if (location + 32 > data.length) {
            revert CalldataOutOfBounds();
        }
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
