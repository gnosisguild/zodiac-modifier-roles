// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

library Decoder {
    error CalldataOutOfBounds();

    function pluckParameters(
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
         * The encoding of the paremeter encoding area is equivalent to a Tuple
         */
        return _carve(data, 4, Topology.prune(parameter));
    }

    function _carve(
        bytes calldata data,
        uint256 offset,
        ParameterTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        assert(parameter.comp != Comparison.OneOf);

        if (parameter._type == ParameterType.Static) {
            result._static = _loadWord(data, offset);
        } else if (parameter._type == ParameterType.Dynamic) {
            result.dynamic = _loadDynamic(data, offset);
        } else if (parameter._type == ParameterType.Dynamic32) {
            result.dynamic32 = _loadDynamic32(data, offset);
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
        ParameterTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        // read length, and move offset to content start
        uint256 length = uint256(_loadWord(data, offset));
        result.children = new ParameterPayload[](length);
        offset += 32;

        bool isInline = _isStatic(parameter.children[0]);
        uint256 itemSize = isInline ? _size(parameter.children[0]) : 32;

        for (uint256 i; i < length; ++i) {
            result.children[i] = _carve(
                data,
                _headOrTailOffset(data, offset, i * itemSize, isInline),
                parameter.children[0]
            );
        }
    }

    function _carveTuple(
        bytes calldata data,
        uint256 offset,
        ParameterTopology memory parameter
    ) private pure returns (ParameterPayload memory result) {
        ParameterTopology[] memory parts = parameter.children;
        result.children = new ParameterPayload[](parts.length);

        uint256 shift;
        for (uint256 i; i < parts.length; ++i) {
            bool isInline = _isStatic(parts[i]);
            result.children[i] = _carve(
                data,
                _headOrTailOffset(data, offset, shift, isInline),
                parts[i]
            );
            shift += isInline ? _size(parts[i]) : 32;
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

    function _isStatic(
        ParameterTopology memory parameter
    ) private pure returns (bool) {
        if (parameter._type == ParameterType.Static) {
            return true;
        } else if (parameter._type == ParameterType.Tuple) {
            for (uint256 i; i < parameter.children.length; ++i) {
                if (!_isStatic(parameter.children[i])) return false;
            }
            return true;
        } else {
            return false;
        }
    }

    function _size(
        ParameterTopology memory parameter
    ) private pure returns (uint256) {
        if (parameter._type == ParameterType.Static) {
            return 32;
        }

        assert(parameter._type == ParameterType.Tuple);

        uint256 result;
        for (uint256 i; i < parameter.children.length; ++i) {
            result += _size(parameter.children[i]);
        }

        return result;
    }

    function _loadDynamic(
        bytes calldata data,
        uint256 offset
    ) private pure returns (bytes memory result) {
        uint256 length = uint256(_loadWord(data, offset));
        uint256 size = 32 + length;

        if (data.length < offset + size) {
            revert CalldataOutOfBounds();
        }

        assembly {
            result := mload(0x40)
            calldatacopy(result, add(data.offset, offset), size)
            mstore(0x40, add(result, size))
        }
    }

    function _loadDynamic32(
        bytes calldata data,
        uint256 offset
    ) private pure returns (bytes32[] memory result) {
        uint256 length = uint256(_loadWord(data, offset));
        uint256 size = 32 + length * 32;

        if (data.length < offset + size) {
            revert CalldataOutOfBounds();
        }

        assembly {
            result := mload(0x40)
            calldatacopy(result, add(data.offset, offset), size)
            mstore(0x40, add(result, size))
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
