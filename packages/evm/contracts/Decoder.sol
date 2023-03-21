// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

/**
 * @title Decoder - a library that discovers parameter locations in calldata
 * from a list of conditions.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 */
library Decoder {
    error CalldataOutOfBounds();

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
            result.location = location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
        } else if (paramType == ParameterType.AbiEncoded) {
            result = __block__(data, location + 32 + 4, node);
            result.location = 32 + location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
        } else if (paramType == ParameterType.Tuple) {
            return __block__(data, location, node);
        } else if (paramType == ParameterType.Array) {
            return __block__(data, location, node);
        }
    }

    function __block__(
        bytes calldata data,
        uint256 location,
        Topology.TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        bool isArray = node.paramType == ParameterType.Array;
        uint256 length = isArray
            ? uint256(_loadWord(data, location))
            : node.children.length;
        result.location = location;
        result.children = new ParameterPayload[](length);

        Topology.TypeTree memory part;
        bool isPartInline;
        if (isArray) {
            part = node.children[0];
            isPartInline = Topology.isInline(part);
            result.size = 32;
            location += 32;
        }

        uint256 offset;
        for (uint256 i; i < length; ++i) {
            if (!isArray) {
                part = node.children[i];
                isPartInline = Topology.isInline(part);
            }

            result.children[i] = _walk(
                data,
                _locationInBlock(data, location, offset, isPartInline),
                part
            );
            result.size += result.children[i].size + (isPartInline ? 0 : 32);
            offset += isPartInline ? result.children[i].size : 32;
        }
    }

    function _locationInBlock(
        bytes calldata data,
        uint256 location,
        uint256 offset,
        bool isInline
    ) private pure returns (uint256) {
        /*
         * When encoding a block, a segment can be either included inline within
         * the block - at the HEAD - or located at an offset relative to the start
         * of the block - at the TAIL.
         */
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
        if (data.length < offset) {
            revert CalldataOutOfBounds();
        }

        assembly {
            result := calldataload(add(data.offset, offset))
        }
    }

    function _ceil32(uint256 size) private pure returns (uint256) {
        // pad size. Source: http://www.cs.nott.ac.uk/~psarb2/G51MPC/slides/NumberLogic.pdf
        return ((size + 32 - 1) / 32) * 32;
    }
}
