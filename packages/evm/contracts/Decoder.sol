// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";

/**
 * @title Decoder - a library that discovers parameter locations in calldata
 * from a list of conditions.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Decoder {
    error CalldataOutOfBounds();

    /**
     * @dev Maps the location and size of parameters in the encoded transaction data.
     * @param data The encoded transaction data.
     * @param condition The condition of the parameters.
     * @return result The mapped location and size of parameters in the encoded transaction data.
     */
    function inspect(
        bytes calldata data,
        Condition memory condition
    ) internal pure returns (ParameterPayload memory result) {
        /*
         * In the parameter encoding area, there is a region called the head
         * that is divided into 32-byte chunks. Each parameter has its own
         * corresponding chunk in the head region:
         * - Static parameters are encoded inline.
         * - Dynamic parameters have an offset to the tail, which is the start
         *   of the actual encoding for the dynamic parameter. Note that the
         *   offset does not include the 4-byte function signature."
         *
         */
        result = __block__(data, 4, Topology.typeTree(condition));
        result.location = 0;
        result.size = data.length;
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
        if (data.length < location + size) {
            revert CalldataOutOfBounds();
        }
        return data[location:location + size];
    }

    /**
     * @dev Walks through a parameter encoding tree and maps their location and
     * size within calldata.
     * @param data The encoded transaction data.
     * @param location The current offset within the calldata buffer.
     * @param node The current node being traversed within the parameter tree.
     * @return result The location and size of the parameter within calldata.
     */
    function _walk(
        bytes calldata data,
        uint256 location,
        Topology.TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        ParameterType paramType = node.paramType;

        if (paramType == ParameterType.Static) {
            result.location = location;
            result.size = 32;
        } else if (paramType == ParameterType.Dynamic) {
            // If the parameter is a dynamic type, set its location and size
            // taking into account the length prefix which is a uint256 value
            // preceding the actual dynamic data.
            result.location = location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
        } else if (paramType == ParameterType.AbiEncoded) {
            // If the parameter is ABI-encoded, parse its components and
            // recursively map their locations and sizes within calldata.
            // take into accounts the encoded length and the 4 bytes selector
            result = __block__(data, location + 32 + 4, node);
            result.location = 32 + location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
        } else if (paramType == ParameterType.Tuple) {
            return __block__(data, location, node);
        } else if (paramType == ParameterType.Array) {
            return _array(data, location, node);
        }
    }

    /**
     * @dev Recursively walk through the TypeTree to decode a block of parameters.
     * @param data The encoded transaction data.
     * @param location The current location of the parameter block being processed.
     * @param node The current TypeTree node being processed.
     * @return result The decoded ParameterPayload.
     */
    function __block__(
        bytes calldata data,
        uint256 location,
        Topology.TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        uint256 length = node.children.length;
        result.location = location;
        result.children = new ParameterPayload[](length);

        uint256 offset;
        unchecked {
            for (uint256 i; i < length; ++i) {
                Topology.TypeTree memory part = node.children[i];
                bool isInline = Topology.isInline(part);

                result.children[i] = _walk(
                    data,
                    _locationInBlock(data, location, offset, isInline),
                    part
                );
                result.size += result.children[i].size + (isInline ? 0 : 32);
                offset += isInline ? result.children[i].size : 32;
            }
        }
    }

    /**
     * @dev Recursively walk through the TypeTree to decode an array parameter.
     * @param data The encoded transaction data.
     * @param location The current location of the array block being processed.
     * @param node The current TypeTree node being processed.
     * @return result The decoded ParameterPayload.
     */
    function _array(
        bytes calldata data,
        uint256 location,
        Topology.TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        uint256 length = uint256(_loadWord(data, location));

        result.location = location;
        result.children = new ParameterPayload[](length);
        result.size = 32;

        Topology.TypeTree memory part = node.children[0];
        bool isInline = Topology.isInline(part);

        uint256 offset;
        unchecked {
            for (uint256 i; i < length; ++i) {
                result.children[i] = _walk(
                    data,
                    _locationInBlock(data, 32 + location, offset, isInline),
                    part
                );
                result.size += result.children[i].size + (isInline ? 0 : 32);
                offset += isInline ? result.children[i].size : 32;
            }
        }
    }

    /**
     * @dev Returns the location of a block part, which may be located inline
     * within the block - at the HEAD - or at an offset relative to the start
     * of the block - at the TAIL.
     *
     * @param data The encoded transaction data.
     * @param location The location of the block within the calldata buffer.
     * @param offset The offset of the block part, relative to the start of the block.
     * @param isInline Whether the block part is located inline within the block.
     *
     * @return The location of the block part within the calldata buffer.
     */
    function _locationInBlock(
        bytes calldata data,
        uint256 location,
        uint256 offset,
        bool isInline
    ) private pure returns (uint256) {
        uint256 headLocation = location + offset;
        if (isInline) {
            return headLocation;
        } else {
            return location + uint256(_loadWord(data, headLocation));
        }
    }

    function _loadWord(
        bytes calldata data,
        uint256 offset
    ) private pure returns (bytes32 result) {
        assembly {
            result := calldataload(add(data.offset, offset))
        }
    }

    function _ceil32(uint256 size) private pure returns (uint256) {
        // pad size. Source: http://www.cs.nott.ac.uk/~psarb2/G51MPC/slides/NumberLogic.pdf
        return ((size + 32 - 1) / 32) * 32;
    }
}
