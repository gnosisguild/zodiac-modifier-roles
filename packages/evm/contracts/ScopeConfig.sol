// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

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
    // 7    bits -> parent
    // 3    bits -> type
    // 4    bits -> comparison
    // 2    bits -> packing
    uint256 private constant bytesPerParameter = 2;
    uint16 private constant offsetParent = 9;
    uint16 private constant offsetType = 6;
    uint16 private constant offsetComparison = 2;
    uint16 private constant offsetPacking = 0;
    uint16 private constant maskParent = uint16(0x7f << offsetParent);
    uint16 private constant maskType = uint16(0x7 << offsetType);
    uint16 private constant maskComparison = uint16(0xf << offsetComparison);
    uint16 private constant maskPacking = 0x3;

    function bufferSize(
        Packing[] memory modes
    ) internal pure returns (uint256 result) {
        uint256 count = modes.length;

        result = count * bytesPerParameter;
        for (uint256 i; i < count; ) {
            if (modes[i] != Packing.Nothing) {
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
        Packing[] memory modes,
        ParameterConfigFlat calldata parameter
    ) internal pure {
        uint16 bits = (uint16(parameter.parent) << offsetParent) |
            (uint16(parameter._type) << offsetType) |
            (uint16(parameter.comp) << offsetComparison) |
            (uint16(modes[index]) << offsetPacking);

        uint256 offset = index * bytesPerParameter;
        unchecked {
            buffer[offset] = bytes1(uint8(bits >> 8));
            buffer[offset + 1] = bytes1(uint8(bits));
        }
        packCompValue(
            buffer,
            _compValueOffset(index, modes),
            modes[index],
            parameter.compValue
        );
    }

    function unpackParameter(
        bytes memory buffer,
        uint256 index,
        Packing[] memory modes,
        ParameterConfig memory result
    ) internal pure {
        uint256 offset = 32 + index * bytesPerParameter;
        bytes32 word;
        assembly {
            word := mload(add(buffer, offset))
        }
        uint16 bits = uint16(bytes2(word));
        result._type = ParameterType((bits & maskType) >> offsetType);
        result.comp = Comparison((bits & maskComparison) >> offsetComparison);
        unpackCompValue(
            buffer,
            _compValueOffset(index, modes),
            modes[index],
            result
        );
    }

    function packCompValue(
        bytes memory buffer,
        uint256 offset,
        Packing mode,
        bytes calldata compValue
    ) private pure returns (uint256) {
        if (mode == Packing.Nothing) {
            return offset;
        }

        bytes32 word = mode == Packing.Hash
            ? keccak256(compValue)
            : bytes32(compValue);

        assembly {
            mstore(add(buffer, offset), word)
        }
        return offset + 32;
    }

    function unpackCompValue(
        bytes memory buffer,
        uint256 offset,
        Packing mode,
        ParameterConfig memory result
    ) private pure {
        if (mode != Packing.Nothing) {
            bytes32 word;
            assembly {
                word := mload(add(buffer, offset))
            }
            result.compValue = word;
            result.isHashed = mode == Packing.Hash;
        }
    }

    function packModes(
        ParameterConfigFlat[] calldata parameters
    ) internal pure returns (Packing[] memory modes) {
        uint256 count = parameters.length;
        modes = new Packing[](count);

        for (uint256 i; i < count; ) {
            modes[i] = _packMode(parameters[i]);

            unchecked {
                ++i;
            }
        }
    }

    function unpackModes(
        bytes memory buffer,
        uint256 count
    ) internal pure returns (uint8[] memory parents, Packing[] memory modes) {
        parents = new uint8[](count);
        modes = new Packing[](count);

        bytes32 word;
        for (uint256 i; i < count; ) {
            uint256 offset = 32 + i * bytesPerParameter;
            assembly {
                word := mload(add(buffer, offset))
            }

            uint16 bits = uint16(bytes2(word));
            parents[i] = uint8((bits & maskParent) >> offsetParent);
            modes[i] = Packing(bits & maskPacking);

            unchecked {
                ++i;
            }
        }
    }

    function _packMode(
        ParameterConfigFlat calldata parameter
    ) private pure returns (Packing) {
        Comparison comparison = parameter.comp;

        if (uint8(comparison) < uint8(Comparison.EqualTo)) {
            return Packing.Nothing;
        }

        return parameter.compValue.length > 32 ? Packing.Hash : Packing.Word;
    }

    function _compValueOffset(
        uint256 index,
        Packing[] memory modes
    ) private pure returns (uint256 offset) {
        offset = 32 + modes.length * bytesPerParameter;
        for (uint256 i; i < index; ) {
            if (modes[i] != Packing.Nothing) {
                offset += 32;
            }

            unchecked {
                ++i;
            }
        }
    }
}
