// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library ScopeConfig {
    enum Packing {
        Nothing,
        Word,
        Hash
    }
    // HEADER
    // 8   bits -> length
    // 2   bits -> options
    // 1   bits -> isWildcarded
    uint256 private constant offsetLength = 248;
    uint256 private constant offsetOptions = 246;
    uint256 private constant offsetIsWildcarded = 245;
    uint256 private constant maskLength = 0xff << offsetLength;
    uint256 private constant maskOptions = 0x3 << offsetOptions;
    uint256 private constant maskIsWildcarded = 0x1 << offsetIsWildcarded;
    // PARAMETER:
    // 8    bits -> parent
    // 3    bits -> type
    // 4    bits -> comparison
    // 1    bits -> isHashed
    uint16 private constant offsetParent = 8;
    uint16 private constant offsetType = 5;
    uint16 private constant offsetComparison = 1;
    uint16 private constant offsetIsHashed = 0;
    uint16 private constant maskParent = uint16(0xff << offsetParent);
    uint16 private constant maskType = uint16(0x7 << offsetType);
    uint16 private constant maskComparison = uint16(0xf << offsetComparison);
    uint16 private constant maskIsHashed = 0x1;

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
        ParameterConfigFlat calldata parameter,
        bool isHashed
    ) internal pure {
        uint16 bits = (uint16(parameter.parent) << offsetParent) |
            (uint16(parameter._type) << offsetType) |
            (uint16(parameter.comp) << offsetComparison) |
            (uint16(isHashed ? 1 : 0) << offsetIsHashed);

        uint256 offset = index * 2;
        unchecked {
            buffer[offset] = bytes1(uint8(bits >> 8));
            buffer[offset + 1] = bytes1(uint8(bits));
        }
    }

    function unpackParameter(
        bytes memory buffer,
        uint256 index
    ) internal pure returns (ParameterConfig memory result) {
        uint256 offset = index * 2 + 32;

        bytes32 word;
        assembly {
            word := mload(add(buffer, offset))
        }
        uint16 bits = uint16(bytes2(word));
        result._type = ParameterType((bits & maskType) >> offsetType);
        result.comp = Comparison((bits & maskComparison) >> offsetComparison);
        result.isHashed = (bits & maskIsHashed) != 0;
    }

    function packCompValues(
        bytes memory buffer,
        ParameterConfigFlat[] calldata parameters
    ) internal pure {
        uint256 count = parameters.length;
        uint256 offset = count * 2 + 32;

        for (uint256 i; i < count; ++i) {
            ParameterConfigFlat calldata parameter = parameters[i];

            Packing mode = packMode(parameter.comp, parameter.compValue);
            if (mode == Packing.Nothing) {
                continue;
            }

            bytes32 word = mode == Packing.Hash
                ? keccak256(parameter.compValue)
                : bytes32(parameter.compValue);

            assembly {
                mstore(add(buffer, offset), word)
            }
            offset += 32;
        }
    }

    function unpackCompValues(
        bytes memory buffer,
        Packing[] memory modes
    ) internal pure returns (bytes32[] memory result) {
        uint256 count = modes.length;
        result = new bytes32[](count);
        uint256 offset = count * 2 + 32;

        for (uint256 i; i < count; ++i) {
            if (modes[i] == Packing.Nothing) {
                continue;
            }

            bytes32 word;
            assembly {
                word := mload(add(buffer, offset))
            }
            offset += 32;
            result[i] = word;
        }
    }

    function unpackMisc(
        bytes memory buffer,
        uint256 length
    ) internal pure returns (uint8[] memory parents, Packing[] memory modes) {
        parents = new uint8[](length);
        modes = new Packing[](length);

        for (uint256 i; i < length; ++i) {
            uint256 offset = 32 + i * 2;
            bytes32 word;
            assembly {
                word := mload(add(buffer, offset))
            }
            uint16 bits = uint16(bytes2(word));
            Comparison comp = Comparison(
                (bits & maskComparison) >> offsetComparison
            );
            bool isHashed = (bits & maskIsHashed) != 0;

            parents[i] = uint8((bits & maskParent) >> offsetParent);
            modes[i] = unpackMode(comp, isHashed);
        }
    }

    function packMode(
        Comparison comparison,
        bytes calldata compValue
    ) internal pure returns (Packing) {
        bool shouldPack = comparison == Comparison.EqualTo ||
            comparison == Comparison.GreaterThan ||
            comparison == Comparison.LessThan ||
            comparison == Comparison.WithinAllowance ||
            comparison == Comparison.Bitmask;

        if (!shouldPack) {
            return Packing.Nothing;
        }

        return compValue.length > 32 ? Packing.Hash : Packing.Word;
    }

    function unpackMode(
        Comparison comparison,
        bool isHashed
    ) internal pure returns (Packing) {
        if (isHashed) {
            return Packing.Hash;
        }

        bool shouldPack = comparison == Comparison.EqualTo ||
            comparison == Comparison.GreaterThan ||
            comparison == Comparison.LessThan ||
            comparison == Comparison.WithinAllowance ||
            comparison == Comparison.Bitmask;

        return shouldPack ? Packing.Word : Packing.Nothing;
    }

    function bufferSize(
        ParameterConfigFlat[] calldata parameters
    ) internal pure returns (uint256 result) {
        uint256 length = parameters.length;

        result = length * 2;

        for (uint256 i; i < length; ++i) {
            if (
                packMode(parameters[i].comp, parameters[i].compValue) !=
                Packing.Nothing
            ) {
                result += 32;
            }
        }
    }
}
