// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library PluckCalldata {
    /// The provided calldata for execution is too short, or an OutOfBounds scoped parameter was configured
    error CalldataOutOfBounds();

    /// @dev Helper function grab a specific static parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckStaticValue(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32) {
        // pre-check: is there a word available for the current parameter at argumentsBlock?
        if (data.length < 4 + index * 32 + 32) {
            revert CalldataOutOfBounds();
        }

        uint256 offset = 4 + index * 32;
        bytes32 value;
        assembly {
            // add 32 - jump over the length encoding of the data bytes array
            value := mload(add(32, add(data, offset)))
        }
        return value;
    }

    /// @dev Helper function grab a specific dynamic parameter from data blob.
    /// @param data the parameter data blob.
    /// @param index position of the parameter in the data.
    function pluckDynamicValue(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes memory result) {
        // this the relative offset
        (uint256 length, uint256 offset) = _dynamicParameterOffset(data, index);
        result = new bytes(length);

        if (offset + length > data.length) {
            revert CalldataOutOfBounds();
        }

        for (uint256 i = 0; i < length; i++) {
            result[i] = data[offset + i];
        }
    }

    function pluckDynamic32Value(
        bytes memory data,
        uint256 index
    ) internal pure returns (bytes32[] memory result) {
        (uint256 length, uint256 offset) = _dynamicParameterOffset(data, index);
        result = new bytes32[](length);

        if (offset + length * 32 > data.length) {
            revert CalldataOutOfBounds();
        }

        for (uint256 i = 0; i < length; i++) {
            offset += 32;
            bytes32 chunk;
            assembly {
                chunk := mload(add(data, offset))
            }
            result[i] = chunk;
        }
    }

    function _dynamicParameterOffset(
        bytes memory data,
        uint256 index
    ) private pure returns (uint256 length, uint256 offset) {
        if (data.length < 36 + index * 32) {
            revert CalldataOutOfBounds();
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

        uint256 argumentsBlock;
        assembly {
            argumentsBlock := add(data, 36)
        }

        uint256 argumentBlockIndex = index * 32;
        uint256 argumentOffset;
        assembly {
            argumentOffset := mload(add(argumentsBlock, argumentBlockIndex))
        }
        assembly {
            // jump over the data buffer length encoding and the function selector
            length := mload(add(32, add(4, add(data, argumentOffset))))
        }

        // we want to return the relative offset
        // so here we jump over the function selector, but also over
        // the parameter length encoding
        offset = 4 + argumentOffset + 32;
    }
}
