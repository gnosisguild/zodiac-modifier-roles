// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

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

struct PluckedParameter {
    ParameterType _type;
    bytes32 _static;
    bytes dynamic;
    bytes32[] dynamic32;
}

library PluckCalldata {
    /// The provided calldata for execution is too short, or an OutOfBounds scoped parameter was configured
    error CalldataOutOfBounds();

    /// @dev Helper function grab a specific static parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckStaticParam(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32) {
        return _pluckStaticValue(data, 4 + index * 32);
    }

    /// @dev Helper function grab a specific dynamic parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckDynamicParam(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes memory result) {
        uint256 offset = _dynamicParamOffset(data, index);
        return _pluckDynamicValue(data, offset);
    }

    function pluckDynamic32Param(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32[] memory result) {
        uint256 offset = _dynamicParamOffset(data, index);
        return _pluckDynamic32Value(data, offset);
    }

    function pluckTupleParam(
        bytes memory data,
        uint256 index,
        ParameterType[] memory tupleTypes
    ) internal pure returns (PluckedParameter[] memory result) {
        result = new PluckedParameter[](tupleTypes.length);

        uint256 offset = _dynamicParamOffset(data, index);
        for (uint256 i = 0; i < tupleTypes.length; i++) {
            ParameterType _type = tupleTypes[i];

            if (_type == ParameterType.Static) {
                result[i]._static = _pluckStaticValue(data, offset + i * 32);
            } else if (_type == ParameterType.Dynamic) {
                result[i].dynamic = _pluckDynamicValue(
                    data,
                    offset + _tailOffset(data, offset + i * 32)
                );
            } else {
                assert(_type == ParameterType.Dynamic32);
                result[i].dynamic32 = _pluckDynamic32Value(
                    data,
                    offset + _tailOffset(data, offset + i * 32)
                );
            }
            result[i]._type = _type;
        }
    }

    function _pluckStaticValue(
        bytes memory data,
        uint256 offset
    ) private pure returns (bytes32) {
        if (data.length < offset + 32) {
            revert CalldataOutOfBounds();
        }
        bytes32 value;
        assembly {
            // add 32 - jump over the length encoding of the data bytes array
            value := mload(add(data, add(offset, 32)))
        }
        return value;
    }

    function _pluckDynamicValue(
        bytes memory data,
        uint256 offset
    ) internal pure returns (bytes memory result) {
        // this the relative offset
        uint256 length;
        assembly {
            length := mload(add(data, add(offset, 32)))
        }
        offset += 32;

        if (offset + length > data.length) {
            revert CalldataOutOfBounds();
        }

        result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = data[offset + i];
        }
    }

    function _pluckDynamic32Value(
        bytes memory data,
        uint256 offset
    ) private pure returns (bytes32[] memory result) {
        uint256 length;
        assembly {
            // jump over the data buffer length encoding and the function selector
            length := mload(add(data, add(offset, 32)))
        }
        offset += 32;

        if (data.length < offset + length * 32) {
            revert CalldataOutOfBounds();
        }

        result = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            bytes32 chunk;
            assembly {
                chunk := mload(add(data, add(offset, 32)))
            }
            result[i] = chunk;
            offset += 32;
        }
    }

    function _dynamicParamOffset(
        bytes memory data,
        uint256 index
    ) private pure returns (uint256) {
        uint256 headOffset = 4 + index * 32;
        return 4 + _tailOffset(data, headOffset);
    }

    function _tailOffset(
        bytes memory data,
        uint256 headOffset
    ) private pure returns (uint256) {
        if (data.length < headOffset + 32) {
            revert CalldataOutOfBounds();
        }

        uint256 tail;
        assembly {
            // jump over the length encoding
            tail := mload(add(data, add(headOffset, 32)))
        }
        return tail;
    }
}
