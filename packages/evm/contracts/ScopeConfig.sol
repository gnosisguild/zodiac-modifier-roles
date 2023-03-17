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
    // CONDITION:
    // 8    bits -> parent
    // 3    bits -> paramType
    // 5    bits -> operator
    uint256 private constant bytesPerCondition = 2;
    uint16 private constant offsetParent = 8;
    uint16 private constant offsetParamType = 5;
    uint16 private constant offsetOperator = 0;
    uint16 private constant maskParent = uint16(0xff << offsetParent);
    uint16 private constant maskParamType = uint16(0x7 << offsetParamType);
    uint16 private constant maskOperator = uint16(0x1f);

    function bufferSize(
        ConditionFlat[] memory conditions
    ) internal pure returns (uint256 result) {
        uint256 count = conditions.length;
        result = count * bytesPerCondition;
        for (uint256 i; i < count; ) {
            if (_modeForOperator(conditions[i].operator) != Packing.Nothing) {
                result += 32;
            }
        }
    }

    function calculateModes(
        ConditionFlat[] memory conditions
    ) internal pure returns (Packing[] memory modes) {
        uint256 count = conditions.length;
        modes = new Packing[](count);
        for (uint256 i; i < count; ) {
            modes[i] = _modeForOperator(conditions[i].operator);
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

    function packCondition(
        bytes memory buffer,
        uint256 index,
        Packing[] memory modes,
        ConditionFlat memory condition
    ) internal pure {
        uint16 bits = (uint16(condition.parent) << offsetParent) |
            (uint16(condition.paramType) << offsetParamType) |
            (uint16(condition.operator) << offsetOperator)

        uint256 offset = index * bytesPerCondition;
        unchecked {
            buffer[offset] = bytes1(uint8(bits >> 8));
            buffer[offset + 1] = bytes1(uint8(bits));
        }

        if (modes[index] != Packing.Nothing) {
            packCompValue(
                buffer,
                _compValueOffset(index, modes),
                modes[index],
                condition.compValue
            );
        }
    }

    function unpackCondition(
        bytes memory buffer,
        uint256 index,
        Packing[] memory modes,
        Condition memory result
    ) internal pure {
        uint256 offset = 32 + index * bytesPerCondition;
        bytes32 word;
        assembly {
            word := mload(add(buffer, offset))
        }
        uint16 bits = uint16(bytes2(word));
        result.paramType = ParameterType((bits & maskParamType) >> offsetParamType);
        result.operator = Comparison((bits & maskOperator) >> offsetOperator);
        if (modes[index] != Packing.Nothing) {
            unpackCompValue(
                buffer,
                _compValueOffset(index, modes),
                modes[index],
                result
            );
        }
    }

    function packCompValue(
        bytes memory buffer,
        uint256 offset,
        Packing mode,
        bytes memory compValue
    ) private pure {
        if (mode != Packing.Nothing) {
            bytes32 word = mode == Packing.Hash
                ? keccak256(compValue)
                : bytes32(compValue);
            assembly {
                mstore(add(buffer, offset), word)
            }
        }
    }

    function unpackCompValue(
        bytes memory buffer,
        uint256 offset,
        Condition memory result
    ) private pure {
        bytes32 word;
        assembly {
            word := mload(add(buffer, offset))
        }
        result.compValue = word;
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
            Operator operator = Operator((bits & maskOperator) >> offsetOperator);
            modes[i] = Packing(bits & maskPacking);
            unchecked {
                ++i;
            }
        }
    }

    function _compValueOffset(
        uint256 index,
        Operator[] memory operators
    ) private pure returns (uint256 offset) {
        offset = 32 + operators.length * bytesPerCondition;
        for (uint256 i; i < index; ) {
            if (_modeForOperator(operators[i]) != Packing.Nothing) {
                offset += 32;
            }

            unchecked {
                ++i;
            }
        }
    }


    function _modeForOperator(Operator operator) internal pure returns (Packing) {
        if(operator < Operator.EqualTo) {
            return Packing.Nothing;
        } else if (operator == Operator.EqualTo) {
            return Packing.Hash;
        } else {
            return Packing.Word;
        }
    }

}

