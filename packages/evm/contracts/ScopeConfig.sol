// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

library ScopeConfig {
    // HEADER
    // 8   bits  -> length
    // 2   bits  -> options
    // 1   bits  -> isWildcarded
    // 5   bits  -> unused
    // 20  bytes -> pointer
    uint256 private constant offsetLength = 248;
    uint256 private constant offsetOptions = 246;
    uint256 private constant offsetIsWildcarded = 245;
    uint256 private constant maskLength = 0xff << offsetLength;
    uint256 private constant maskOptions = 0x3 << offsetOptions;
    uint256 private constant maskIsWildcarded = 0x1 << offsetIsWildcarded;
    // PARAMETER:
    // 8    bits -> parent
    // 4    bits -> type
    // 4    bits -> comparison
    uint256 private constant bytesPerParameter = 2;
    uint16 private constant offsetParent = 8;
    uint16 private constant offsetType = 4;
    uint16 private constant offsetComparison = 0;
    uint16 private constant maskParent = uint16(0xff << offsetParent);
    uint16 private constant maskType = uint16(0xf << offsetType);
    uint16 private constant maskComparison = uint16(0xf << offsetComparison);

    function packedSize(
        ParameterConfigFlat[] memory parameters
    ) internal pure returns (uint256 result) {
        uint256 paramCount = parameters.length;

        result = paramCount * bytesPerParameter;
        for (uint256 i; i < paramCount; ) {
            if (parameters[i].comp >= Comparison.EqualTo) {
                result += 32;
            }

            unchecked {
                ++i;
            }
        }
    }

    function packHeader(
        uint256 length,
        bool isWildcarded,
        ExecutionOptions options,
        address pointer
    ) internal pure returns (bytes32 result) {
        result = bytes32(length << offsetLength);
        if (isWildcarded) {
            result |= bytes32(maskIsWildcarded);
        }
        result |= bytes32(uint256(options)) << offsetOptions;
        result |= bytes32(bytes20(pointer)) >> 16;
    }

    function unpackHeader(
        bytes32 header
    )
        internal
        pure
        returns (
            uint256 length,
            bool isWildcarded,
            ExecutionOptions options,
            address pointer
        )
    {
        length = (uint256(header) & maskLength) >> offsetLength;
        isWildcarded = uint256(header) & maskIsWildcarded != 0;
        options = ExecutionOptions(
            (uint256(header) & maskOptions) >> offsetOptions
        );
        pointer = address(bytes20(header << 16));
    }

    function packParameter(
        bytes memory buffer,
        uint256 index,
        ParameterConfigFlat memory parameter
    ) internal pure {
        uint16 bits = (uint16(parameter.parent) << offsetParent) |
            (uint16(parameter._type) << offsetType) |
            (uint16(parameter.comp) << offsetComparison);

        uint256 offset = index * bytesPerParameter;
        unchecked {
            buffer[offset] = bytes1(uint8(bits >> 8));
            buffer[offset + 1] = bytes1(uint8(bits));
        }
    }

    function packCompValue(
        bytes memory buffer,
        uint256 offset,
        ParameterConfigFlat memory parameter
    ) internal pure {
        bytes32 word = parameter.comp == Comparison.EqualTo
            ? keccak256(parameter.compValue)
            : bytes32(parameter.compValue);

        assembly {
            mstore(add(buffer, offset), word)
        }
    }

    function unpackParameters(
        bytes memory buffer,
        uint256 paramCount
    )
        internal
        pure
        returns (
            ParameterConfigFlat[] memory result,
            bytes32[] memory compValues
        )
    {
        result = new ParameterConfigFlat[](paramCount);
        compValues = new bytes32[](paramCount);

        bytes32 word;
        uint256 paramOffset;
        uint256 compValueOffset = 32 + paramCount * bytesPerParameter;
        for (uint256 i; i < paramCount; ) {
            paramOffset = 32 + i * bytesPerParameter;
            assembly {
                word := mload(add(buffer, paramOffset))
            }

            uint16 bits = uint16(bytes2(word));
            result[i].parent = uint8((bits & maskParent) >> offsetParent);
            result[i]._type = ParameterType((bits & maskType) >> offsetType);
            result[i].comp = Comparison(
                (bits & maskComparison) >> offsetComparison
            );

            if (result[i].comp >= Comparison.EqualTo) {
                assembly {
                    word := mload(add(buffer, compValueOffset))
                }
                compValues[i] = word;
                compValueOffset += 32;
            }

            unchecked {
                ++i;
            }
        }
    }
}
