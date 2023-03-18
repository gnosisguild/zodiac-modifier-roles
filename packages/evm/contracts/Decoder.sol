// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

library Decoder {
    error CalldataOutOfBounds();

    function inspect(
        bytes calldata data,
        ParameterConfig memory parameter
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
        result = __block__(data, 4, Topology.unfold(parameter));
        result.location = 0;
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
        TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        ParameterType paramType = node._type;
        assert(paramType != ParameterType.None);

        if (paramType == ParameterType.Static) {
            result.isInline = true;
            result.location = location;
            result.size = 32;
        } else if (paramType == ParameterType.Dynamic) {
            result.location = location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
        } else if (paramType == ParameterType.AbiEncoded) {
            result = __block__(data, location + 32 + 4, node);
            result.location = location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
        } else if (paramType == ParameterType.Tuple) {
            return __block__(data, location, node);
        } else {
            return _array(data, location, node);
        }
    }

    function _array(
        bytes calldata data,
        uint256 location,
        TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        uint256 length = uint256(_loadWord(data, location));
        result.location = location;
        result.size = 32;
        result.children = new ParameterPayload[](length);

        uint256 offset;
        bool isPartInline = _isInline(node.children[0]);
        for (uint256 i; i < length; ++i) {
            result.children[i] = _walk(
                data,
                isPartInline
                    ? 32 + location + offset
                    : _tailLocation(data, 32 + location, offset),
                node.children[0]
            );
            result.size += result.children[i].size + (isPartInline ? 0 : 32);
            offset += isPartInline ? result.children[i].size : 32;
        }
    }

    function __block__(
        bytes calldata data,
        uint256 location,
        TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        uint256 length = node.children.length;

        result.isInline = true;
        result.location = location;
        result.children = new ParameterPayload[](length);

        uint256 offset;
        for (uint256 i; i < length; ++i) {
            TypeTree memory part = node.children[i];
            if (part._type == ParameterType.None) {
                continue;
            }

            bool isPartInline = _isInline(part);
            result.isInline = result.isInline && isPartInline;
            result.children[i] = _walk(
                data,
                isPartInline
                    ? location + offset
                    : _tailLocation(data, location, offset),
                part
            );
            result.size += result.children[i].size + (isPartInline ? 0 : 32);
            offset += isPartInline ? result.children[i].size : 32;
        }
    }

    function _tailLocation(
        bytes calldata data,
        uint256 location,
        uint256 offset
    ) private pure returns (uint256) {
        /*
         * When encoding a block, a segment can be either included inline within
         * the block - at the HEAD - or located at an offset relative to the start
         * of the block - at the TAIL.
         */
        uint256 headLocation = location + offset;
        return location + uint256(_loadWord(data, headLocation));
    }

    function _isInline(TypeTree memory node) private pure returns (bool) {
        assert(node._type != ParameterType.None);

        if (node._type == ParameterType.Static) {
            return true;
        } else if (
            node._type == ParameterType.Dynamic ||
            node._type == ParameterType.Array ||
            node._type == ParameterType.AbiEncoded
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
