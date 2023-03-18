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
        result.children = __block__(
            data,
            4,
            Topology.unfold(parameter).children
        );
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
            result.location = location;
            result.size = 32;
        } else if (paramType == ParameterType.Dynamic) {
            result.location = location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
        } else if (paramType == ParameterType.AbiEncoded) {
            result.location = location;
            result.size = 32 + _ceil32(uint256(_loadWord(data, location)));
            result.children = __block__(data, location + 32 + 4, node.children);
        } else if (paramType == ParameterType.Tuple) {
            return _tuple(data, location, node);
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
        result.children = new ParameterPayload[](length);

        (bool isInline, uint256 itemSize) = _headSize(node.children[0]);
        for (uint256 i; i < length; ++i) {
            result.children[i] = _walk(
                data,
                _partLocation(data, location + 32, i * itemSize, isInline),
                node.children[0]
            );
        }
        result.size = _totalSize(result);
    }

    function _tuple(
        bytes calldata data,
        uint256 location,
        TypeTree memory node
    ) private pure returns (ParameterPayload memory result) {
        result.location = location;
        result.children = __block__(data, location, node.children);
        result.size = _totalSize(result);
    }

    function __block__(
        bytes calldata data,
        uint256 location,
        TypeTree[] memory parts
    ) private pure returns (ParameterPayload[] memory result) {
        result = new ParameterPayload[](parts.length);

        uint256 offset;
        for (uint256 i; i < parts.length; ++i) {
            TypeTree memory part = parts[i];
            if (part._type == ParameterType.None) {
                continue;
            }

            (bool isInline, uint256 size) = _headSize(part);

            result[i] = _walk(
                data,
                _partLocation(data, location, offset, isInline),
                part
            );
            offset += size;
        }
    }

    function _partLocation(
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
            // located at head
            return headLocation;
        } else {
            // located at tail
            return location + uint256(_loadWord(data, headLocation));
        }
    }

    function _headSize(
        TypeTree memory node
    ) private pure returns (bool, uint256) {
        assert(node._type != ParameterType.None);

        if (node._type == ParameterType.Static) {
            return (true, 32);
        } else if (
            node._type == ParameterType.Dynamic ||
            node._type == ParameterType.Array ||
            node._type == ParameterType.AbiEncoded
        ) {
            return (false, 32);
        } else {
            uint256 size;
            for (uint256 i; i < node.children.length; ++i) {
                (bool isInline, uint256 nextSize) = _headSize(node.children[i]);
                if (!isInline) {
                    return (false, 32);
                } else {
                    size += nextSize;
                }
            }
            return (true, size);
        }
    }

    function _totalSize(
        ParameterPayload memory payload
    ) private pure returns (uint256 result) {
        uint256 length = payload.children.length;

        if (length == 0) {
            return 32;
        }

        for (uint256 i; i < length; ++i) {
            uint256 location = payload.children[i].location;
            uint256 size = _ceil32(payload.children[i].size);
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
