// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";
import "hardhat/console.sol";

library PluckCalldata {
    error CalldataOutOfBounds();

    function pluck(
        bytes memory data,
        ParameterLayout[] memory layout
    ) internal pure returns (ParameterPayload[] memory result) {
        result = new ParameterPayload[](layout.length);
        for (uint256 i = 0; i < layout.length; i++) {
            result[i] = _carve(
                data,
                _parameterOffset(data, i, _isStatic(layout[i])),
                layout[i]
            );
        }
    }

    /// @dev Helper function grab a specific static parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckStaticParam(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32) {
        return _loadWordAt(data, _parameterOffset(data, index, true));
    }

    /// @dev Helper function grab a specific dynamic parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckDynamicParam(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes memory result) {
        return _carveDynamic(data, _parameterOffset(data, index, false));
    }

    function pluckDynamic32Param(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32[] memory result) {
        return _carveDynamic32(data, _parameterOffset(data, index, false));
    }

    function _carve(
        bytes memory data,
        uint256 offset,
        ParameterLayout memory layout
    ) private pure returns (ParameterPayload memory result) {
        if (layout._type == ParameterType.Static) {
            result._static = _loadWordAt(data, offset);
        } else if (layout._type == ParameterType.Dynamic) {
            result.dynamic = _carveDynamic(data, offset);
        } else if (layout._type == ParameterType.Dynamic32) {
            result.dynamic32 = _carveDynamic32(data, offset);
        } else if (layout._type == ParameterType.Tuple) {
            return _carveTuple(data, offset, layout);
        } else {
            assert(layout._type == ParameterType.Array);
            return _carveArray(data, offset, layout);
        }
    }

    function _carveDynamic(
        bytes memory data,
        uint256 offset
    ) internal pure returns (bytes memory result) {
        // read length, and move offset to content start
        uint256 length = uint256(_loadWordAt(data, offset));
        offset += 32;

        if (data.length < offset + length) {
            revert CalldataOutOfBounds();
        }

        result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = data[offset + i];
        }
    }

    function _carveDynamic32(
        bytes memory data,
        uint256 offset
    ) private pure returns (bytes32[] memory result) {
        // read length and move offset to content start
        uint256 length = uint256(_loadWordAt(data, offset));
        offset += 32;

        if (data.length < offset + length * 32) {
            revert CalldataOutOfBounds();
        }

        result = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = _loadWordAt(data, offset);
            offset += 32;
        }
    }

    function _carveTuple(
        bytes memory data,
        uint256 offset,
        ParameterLayout memory layout
    ) internal pure returns (ParameterPayload memory result) {
        ParameterLayout[] memory parts = layout.nested;
        result.nested = new ParameterPayload[](parts.length);

        uint256 shift;
        for (uint256 i = 0; i < parts.length; i++) {
            bool isInline = _isStatic(parts[i]);
            result.nested[i] = _carve(
                data,
                _headOrTailOffset(data, offset, shift, isInline),
                parts[i]
            );
            shift += isInline ? _size(parts[i]) : 32;
        }
    }

    function _carveArray(
        bytes memory data,
        uint256 offset,
        ParameterLayout memory layout
    ) private pure returns (ParameterPayload memory result) {
        assert(layout.nested.length == 1);

        // read length, and move offset to content start
        uint256 length = uint256(_loadWordAt(data, offset));
        result.nested = new ParameterPayload[](length);
        offset += 32;

        bool isInline = _isStatic(layout.nested[0]);
        uint256 itemSize = isInline ? _size(layout.nested[0]) : 32;

        for (uint256 i; i < length; i++) {
            result.nested[i] = _carve(
                data,
                _headOrTailOffset(data, offset, i * itemSize, isInline),
                layout.nested[0]
            );
        }
    }

    function _parameterOffset(
        bytes memory data,
        uint256 index,
        bool isStaticParam
    ) private pure returns (uint256) {
        /*
         * In the parameter encoding area, there is a region called the head
         * that is divided into 32-byte chunks. Each parameter has its own
         * corresponding chunk in the head region:
         * - Static parameters are encoded inline.
         * - Dynamic parameters have an offset to the tail, which is the start
         *   of the actual encoding for the dynamic parameter. Note that the
         *   offset does not include the 4-byte function signature."
         */

        return _headOrTailOffset(data, 4, index * 32, isStaticParam);
    }

    function _headOrTailOffset(
        bytes memory data,
        uint256 offset,
        uint256 shift,
        bool isInline
    ) private pure returns (uint256) {
        uint256 headOffset = offset + shift;
        if (isInline) {
            return headOffset;
        }
        uint256 tailOffset = offset + uint256(_loadWordAt(data, headOffset));
        return tailOffset;
    }

    function _isStatic(
        ParameterLayout memory layout
    ) private pure returns (bool) {
        if (layout._type == ParameterType.Static) {
            return true;
        } else if (layout._type == ParameterType.Tuple) {
            for (uint256 i = 0; i < layout.nested.length; ++i) {
                if (!_isStatic(layout.nested[i])) return false;
            }
            return true;
        } else {
            // Dynamic
            // Dynamic32
            // Array
            return false;
        }
    }

    function _size(
        ParameterLayout memory layout
    ) private pure returns (uint256) {
        if (layout._type == ParameterType.Static) {
            return 32;
        }

        assert(layout._type == ParameterType.Tuple);

        uint256 result;
        for (uint256 i; i < layout.nested.length; i++) {
            result += _size(layout.nested[i]);
        }

        return result;
    }

    function _loadWordAt(
        bytes memory data,
        uint256 offset
    ) private pure returns (bytes32) {
        if (data.length < offset + 32) {
            revert CalldataOutOfBounds();
        }

        bytes32 result;
        assembly {
            // jump over the length encoding
            result := mload(add(data, add(offset, 32)))
        }
        return result;
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
