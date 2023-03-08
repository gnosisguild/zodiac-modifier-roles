// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

library Decoder {
    error CalldataOutOfBounds();

    function inspect(
        bytes calldata data,
        TypeTopology memory parameter
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
        result.children = __block__(data, 4, parameter.children);
        result.size = data.length;
    }

    function pluck(
        bytes calldata data,
        uint256 location,
        uint256 length
    ) internal pure returns (bytes calldata) {
        if (data.length < location + length) {
            revert CalldataOutOfBounds();
        }
        return data[location:location + length];
    }

    function _walk(
        bytes calldata data,
        uint256 location,
        TypeTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        ParameterType paramType = parameter._type;

        if (paramType == ParameterType.Static) {
            result.location = location;
            result.size = 32;
        } else if (paramType == ParameterType.Dynamic) {
            result.location = location + 32;
            result.size = uint256(_loadWord(data, location));
        } else if (paramType == ParameterType.AbiEncoded) {
            result.location = location + 32;
            result.size = uint256(_loadWord(data, location));
            result.children = __block__(
                data,
                result.location + 4,
                parameter.children
            );
        } else if (paramType == ParameterType.Tuple) {
            return _tuple(data, location, parameter);
        } else {
            assert(paramType == ParameterType.Array);
            return _array(data, location, parameter);
        }
    }

    function _array(
        bytes calldata data,
        uint256 location,
        TypeTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        uint256 length = uint256(_loadWord(data, location));
        result.children = new ParameterPayload[](length);

        bool isInline = Topology.isStatic(parameter.children[0]);
        uint256 itemSize = isInline
            ? Topology.typeSize(parameter.children[0])
            : 32;

        for (uint256 i; i < length; ++i) {
            result.children[i] = _walk(
                data,
                _locationInBlock(data, location + 32, i * itemSize, isInline),
                parameter.children[0]
            );
        }
        result.location = location;
        result.size = _size(result);
    }

    function _tuple(
        bytes calldata data,
        uint256 location,
        TypeTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        result.location = location;
        result.children = __block__(data, location, parameter.children);
        result.size = _size(result);
    }

    function __block__(
        bytes calldata data,
        uint256 location,
        TypeTopology[] memory parts
    ) private pure returns (ParameterPayload[] memory result) {
        result = new ParameterPayload[](parts.length);

        uint256 offset;
        for (uint256 i; i < parts.length; ++i) {
            bool isInline = Topology.isStatic(parts[i]);
            result[i] = _walk(
                data,
                _locationInBlock(data, location, offset, isInline),
                parts[i]
            );
            offset += isInline ? Topology.typeSize(parts[i]) : 32;
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
            // located in head
            return headLocation;
        } else {
            // located at tail
            return location + uint256(_loadWord(data, headLocation));
        }
    }

    function _size(
        ParameterPayload memory payload
    ) private pure returns (uint256 result) {
        uint256 length = payload.children.length;

        for (uint256 i; i < length; ++i) {
            uint256 location = payload.children[i].location;
            // pad size. Source: http://www.cs.nott.ac.uk/~psarb2/G51MPC/slides/NumberLogic.pdf
            uint256 size = ((payload.children[i].size + 32 - 1) / 32) * 32;
            uint256 curr = location + size - payload.location;

            if (curr > result) {
                result = curr;
            }
        }
    }

    function _loadWord(
        bytes calldata data,
        uint256 offset
    ) private pure returns (bytes32 result) {
        if (data.length < offset + 32) {
            revert CalldataOutOfBounds();
        }

        assembly {
            result := calldataload(add(data.offset, offset))
        }
    }
}
