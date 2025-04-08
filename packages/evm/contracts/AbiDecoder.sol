// SPDX-License-Identifier: LGPL-3.0
pragma solidity >=0.8.21 <0.9.0;

import "./Types.sol";

/**
 * @title AbiDecoder - A library that decodes abi encoded calldata and returns
 *        parameter payloads
 *
 * @author gnosisguild
 */
library AbiDecoder {
    error CalldataOutOfBounds();

    /**
     * @dev Maps the location and size of a parameter in calldata according to
     *      an ABI `typeTree`.
     *
     * @param data     The encoded transaction data to be inspected.
     * @param typeTree Array of ABI type definitions forming the typeTree.
     * @param index    Entrypoint in typeTree.
     * @return result  The mapped location and size of parameters in the encoded
     *                 transaction data.
     */
    function inspect(
        bytes calldata data,
        AbiTypeTree[] memory typeTree,
        uint256 index
    ) internal pure returns (Payload memory result) {
        assert(
            typeTree[index]._type == AbiType.Calldata ||
                typeTree[index]._type == AbiType.AbiEncoded
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
            typeTree[index]._type == AbiType.Calldata ? 4 : 0,
            typeTree,
            index,
            typeTree[index].fields.length,
            result
        );
        result.size = data.length;
    }

    /**
     * @dev Walks through a parameter encoding tree and maps their location
     *      and size within calldata.
     *
     * @param data     The encoded transaction data.
     * @param location The current absolute position within calldata.
     * @param typeTree Array of ABI type definitions forming the typeTree.
     * @param index    Index of current typeTree node.
     * @param result   The output payload containing the parameter's location
     *                 and size in calldata.
     */
    function _walk(
        bytes calldata data,
        uint256 location,
        AbiTypeTree[] memory typeTree,
        uint256 index,
        Payload memory result
    ) private pure {
        AbiType _type = typeTree[index]._type;

        if (_type == AbiType.Static) {
            result.size = 32;
        } else if (_type == AbiType.Dynamic) {
            result.size = 32 + _ceil32(uint256(word(data, location)));
        } else if (_type == AbiType.Tuple) {
            __block__(
                data,
                location,
                typeTree,
                index,
                typeTree[index].fields.length,
                result
            );
        } else if (_type == AbiType.Array) {
            __block__(
                data,
                location + 32,
                typeTree,
                index,
                uint256(word(data, location)),
                result
            );
            result.size += 32;
        } else if (_type == AbiType.Calldata || _type == AbiType.AbiEncoded) {
            __block__(
                data,
                location + 32 + (_type == AbiType.Calldata ? 4 : 0),
                typeTree,
                index,
                typeTree[index].fields.length,
                result
            );
            result.size = 32 + _ceil32(uint256(word(data, location)));
        }
        result.index = index;
        result.location = location;
    }

    /**
     * @dev Decodes a structured block of parameters from calldata. Maps
     *      locations of values within Array or Tuple sections, which both use the
     *      HEAD+TAIL+OFFSET encoding scheme.
     *
     * @param data        The encoded transaction data (in calldata for gas
     *                    efficiency).
     * @param location    Starting byte position of the block in calldata.
     * @param typeTree    Array of ABI type definitions forming the typeTree.
     * @param index       Index of the current node in the `typeTree`.
     * @param blockLength Number of elements to process in this block.
     * @param result      The decoded `Payload`.
     *
     * @notice Handles two block types:
     *     1. Arrays: Length determined by a 32-byte word before the data.
     *     2. Tuples: Length determined by the number of fields in the type.
     */

    function __block__(
        bytes calldata data,
        uint256 location,
        AbiTypeTree[] memory typeTree,
        uint256 index,
        uint256 blockLength,
        Payload memory result
    ) private pure {
        AbiTypeTree memory node = typeTree[index];

        result.children = new Payload[](blockLength);

        bool isInline;
        uint256 offset;
        for (uint256 i; i < blockLength; i++) {
            if (i == 0 || node._type != AbiType.Array) {
                // For structs or the first element of an array, calculate if element inline
                // For array elements after the first, they all have the same inline status
                isInline = _isInline(typeTree, node.fields[i]);
            }

            _walk(
                data,
                _locationInBlock(data, location, offset, isInline),
                typeTree,
                node.fields[node._type == AbiType.Array ? 0 : i],
                result.children[i]
            );

            // Update the total size and offset
            uint256 childSize = result.children[i].size;

            // For non-inline elements, we need to account for the 32-byte pointer
            result.size += childSize + (isInline ? 0 : 32);

            // Update the offset in the block for the next element
            offset += isInline ? childSize : 32;
        }
    }

    /**
     * @dev Calculates the absolute position of a chunk in calldata.
     *      For inline parameters, returns the position in the HEAD region.
     *      For non-inline parameters, follows the offset pointer to TAIL.
     *
     * @param data     The encoded calldata.
     * @param location Base position where the HEAD region begins.
     * @param offset   Relative position within the HEAD region.
     * @param isInline Whether the parameter is inline or referenced via offset.
     * @return         The absolute position of the chunk in calldata.
     */
    function _locationInBlock(
        bytes calldata data,
        uint256 location,
        uint256 offset,
        bool isInline
    ) private pure returns (uint256) {
        if (isInline) {
            return location + offset;
        } else {
            return location + uint256(word(data, location + offset));
        }
    }

    /**
     * @dev Recursively traverses the ABI typeTree to determine if the
     *      parameter is inline. A parameter is considered inline if it is
     *      either a static type or a tuple containing only static types.
     *      Arrays and dynamic types break the inline chain.
     *
     *      Additionally, nested `AbiEncoded*` nodes are always embedded within
     *      a dynamic placeholder node, making them non-inline as well.
     *
     * @param typeTree Array of ABI type definitions forming the typeTree.
     * @param index    Index of the current node in the typeTree.
     * @return         `true` if the parameter is inline, `false` otherwise.
     */
    function _isInline(
        AbiTypeTree[] memory typeTree,
        uint256 index
    ) private pure returns (bool) {
        AbiType _type = typeTree[index]._type;
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
            uint256 length = typeTree[index].fields.length;

            for (uint256 i; i < length; ) {
                if (!_isInline(typeTree, typeTree[index].fields[i])) {
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
