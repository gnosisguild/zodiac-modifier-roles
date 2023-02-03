// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

library Decoder {
    error CalldataOutOfBounds();

    function inspect(
        bytes calldata data,
        TypeTopology[] memory parameters
    ) internal pure returns (ParameterPayload[] memory result) {
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
        return _carveParts(data, 4, parameters);
    }

    function _carve(
        bytes calldata data,
        uint256 offset,
        TypeTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        if (parameter._type == ParameterType.Static) {
            result.offset = offset;
            result.size = 32;
        } else if (parameter._type == ParameterType.Dynamic) {
            result.offset = offset + 32;
            result.size = uint256(_loadWord(data, offset));
        } else if (parameter._type == ParameterType.Array) {
            return _carveArray(data, offset, parameter);
        } else {
            assert(parameter._type == ParameterType.Tuple);
            return _carveTuple(data, offset, parameter);
        }
    }

    function _carveArray(
        bytes calldata data,
        uint256 offset,
        TypeTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        uint256 length = uint256(_loadWord(data, offset));
        result.children = new ParameterPayload[](length);

        bool isInline = Topology.isStatic(parameter.children[0]);
        uint256 itemSize = isInline
            ? Topology.typeSize(parameter.children[0])
            : 32;

        for (uint256 i; i < length; ++i) {
            result.children[i] = _carve(
                data,
                _headOrTailOffset(data, offset + 32, i * itemSize, isInline),
                parameter.children[0]
            );
        }
        result.offset = offset;
        result.size = _size(result);
    }

    function _carveTuple(
        bytes calldata data,
        uint256 offset,
        TypeTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        result.children = _carveParts(data, offset, parameter.children);
        result.offset = offset;
        result.size = _size(result);
    }

    function _carveParts(
        bytes calldata data,
        uint256 offset,
        TypeTopology[] memory parts
    ) private pure returns (ParameterPayload[] memory result) {
        result = new ParameterPayload[](parts.length);

        uint256 shift;
        for (uint256 i; i < parts.length; ++i) {
            bool isInline = Topology.isStatic(parts[i]);
            result[i] = _carve(
                data,
                _headOrTailOffset(data, offset, shift, isInline),
                parts[i]
            );
            shift += isInline ? Topology.typeSize(parts[i]) : 32;
        }
    }

    function _headOrTailOffset(
        bytes calldata data,
        uint256 offset,
        uint256 shift,
        bool isInline
    ) private pure returns (uint256) {
        uint256 headOffset = offset + shift;
        if (isInline) {
            return headOffset;
        }
        uint256 tailOffset = offset + uint256(_loadWord(data, headOffset));
        return tailOffset;
    }

    function _size(
        ParameterPayload memory payload
    ) private pure returns (uint256 result) {
        uint256 length = payload.children.length;

        for (uint256 i; i < length; ++i) {
            uint256 offset = payload.children[i].offset;
            // pad size. Source: http://www.cs.nott.ac.uk/~psarb2/G51MPC/slides/NumberLogic.pdf
            uint256 size = ((payload.children[i].size + 32 - 1) / 32) * 32;
            uint256 curr = offset + size - payload.offset;

            if (curr > result) {
                result = curr;
            }
        }
    }

    function pluck(
        bytes calldata data,
        uint256 offset,
        uint256 size
    ) internal pure returns (bytes memory result) {
        if (data.length < offset + size) {
            revert CalldataOutOfBounds();
        }
        // result = data[offset:size];
        // input[1:];
        assembly {
            result := mload(0x40)
            mstore(result, size)
            calldatacopy(add(result, 32), add(data.offset, offset), size)
            mstore(0x40, add(result, add(32, size)))
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

/*
 * Encoded calldata:
 * 4  bytes -> function selector
 * 32 bytes -> sequence, one chunk per parameter
 *
 * There is one (byte32) chunk per parameter. Depending on type it contains:
 * Static    -> value encoded inline (not plucked by this function)
 * Dynamic   -> a byte offset to encoded data payload
 * Dynamic32 -> a byte offset to encoded data payload
 * Note: Fixed Sized Arrays (e.g., bool[2]), are encoded inline
 *
 *
 * At encoded payload, the first 32 bytes are the length encoding of the parameter payload. Depending on ParameterType:
 * Dynamic   -> length in bytes
 * Dynamic32 -> length in bytes32
 * Note: Dynamic types are: bytes, string
 * Note: Dynamic32 types are non-nested arrays: address[] bytes32[] uint[] etc
 */
