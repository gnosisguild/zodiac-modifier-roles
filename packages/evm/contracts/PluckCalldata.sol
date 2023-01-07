// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

struct PluckedParameter {
    ParameterType _type;
    bytes32 _static;
    bytes dynamic;
    bytes32[] dynamic32;
}

library PluckCalldata {
    error CalldataOutOfBounds();

    /// @dev Helper function grab a specific static parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckStaticParam(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32) {
        return _loadWordAt(data, 4 + index * 32);
    }

    /// @dev Helper function grab a specific dynamic parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckDynamicParam(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes memory result) {
        uint256 headOffset = 4 + index * 32;
        uint256 tailOffset = 4 + _loadUIntAt(data, headOffset);
        return _carveDynamic(data, tailOffset);
    }

    function pluckDynamic32Param(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32[] memory result) {
        uint256 headOffset = 4 + index * 32;
        uint256 tailOffset = 4 + _loadUIntAt(data, headOffset);
        return _carveDynamic32(data, tailOffset);
    }

    function pluckTupleParam(
        bytes memory data,
        uint256 index,
        ParameterType[] memory tupleTypes
    ) internal pure returns (PluckedParameter[] memory) {
        uint256 headOffset = 4 + index * 32;
        uint256 tailOffset = 4 + _loadUIntAt(data, headOffset);
        return _carveTuple(data, tailOffset, tupleTypes);
    }

    function pluckTupleArrayParam(
        bytes memory data,
        uint256 index,
        ParameterType[] memory types
    ) internal pure returns (PluckedParameter[][] memory result) {
        // index head at parameter location, and then read the tail offset
        // which is the offset to the actual parameter encoding area
        uint256 headOffset = 4 + index * 32;
        uint256 tailOffset = 4 + _loadUIntAt(data, headOffset);

        // The tail for the array param contains starts with the encoded length
        // which is a 32 byte chunk that indicates how many items are in the array
        uint256 length = _loadUIntAt(data, tailOffset);
        result = new PluckedParameter[][](length);
        uint256 offset = tailOffset + 32;

        // If the Tuple is Static - each tuple/item is encoded inline
        // If the Tuple is Dynamic - it is followed by a 32 bytes head area for each item
        if (_allStatic(types)) {
            for (uint256 i; i < length; i++) {
                result[i] = _carveTuple(
                    data,
                    offset + i * 32 * types.length,
                    types
                );
            }
        } else {
            for (uint256 i; i < length; i++) {
                headOffset = offset + i * 32;
                tailOffset = offset + _loadUIntAt(data, headOffset);
                result[i] = _carveTuple(data, tailOffset, types);
            }
        }
    }

    function _carveDynamic(
        bytes memory data,
        uint256 offset
    ) internal pure returns (bytes memory result) {
        // this the relative offset
        uint256 length = _loadUIntAt(data, offset);
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
        uint256 length = _loadUIntAt(data, offset);
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
        ParameterType[] memory types
    ) internal pure returns (PluckedParameter[] memory result) {
        result = new PluckedParameter[](types.length);

        for (uint256 i = 0; i < types.length; i++) {
            uint256 headOffset = offset + i * 32;
            if (types[i] == ParameterType.Static) {
                result[i]._static = _loadWordAt(data, headOffset);
            } else if (types[i] == ParameterType.Dynamic) {
                uint256 tailOffset = offset + _loadUIntAt(data, headOffset);
                result[i].dynamic = _carveDynamic(data, tailOffset);
            } else {
                assert(types[i] == ParameterType.Dynamic32);
                uint256 tailOffset = offset + _loadUIntAt(data, headOffset);
                result[i].dynamic32 = _carveDynamic32(data, tailOffset);
            }
            result[i]._type = types[i];
        }
    }

    function _loadUIntAt(
        bytes memory data,
        uint256 offset
    ) private pure returns (uint256) {
        if (data.length < offset + 32) {
            revert CalldataOutOfBounds();
        }

        uint256 result;
        assembly {
            // jump over the length encoding
            result := mload(add(data, add(offset, 32)))
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

    function _allStatic(
        ParameterType[] memory types
    ) private pure returns (bool) {
        for (uint256 i = 0; i < types.length; i++) {
            if (types[i] != ParameterType.Static) {
                return false;
            }
        }
        return true;
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
 * Note: Nested types also do not follow the above described rules, and are unsupported
 * Note: The offset to payload does not include 4 bytes for functionSig
 *
 *
 * At encoded payload, the first 32 bytes are the length encoding of the parameter payload. Depending on ParameterType:
 * Dynamic   -> length in bytes
 * Dynamic32 -> length in bytes32
 * Note: Dynamic types are: bytes, string
 * Note: Dynamic32 types are non-nested arrays: address[] bytes32[] uint[] etc
 */
