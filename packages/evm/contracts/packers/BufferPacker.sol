// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

/**
 * @title BufferPacker a library that provides packing functions for permission
 * conditions. It allows packing externally provided ConditionsFlat[] into a
 * storage-optimized buffer
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library BufferPacker {
    // HEADER (stored as a single word in storage)
    // 2   bytes -> paramCount (Condition count)
    // 1   bytes -> options (ExecutionOptions)
    // 1   bytes -> isWildcarded
    // 8   bytes -> unused
    // 20  bytes -> pointer (address containining packed conditions)
    uint256 private constant offsetParamCount = 240;
    uint256 private constant offsetOptions = 224;
    uint256 private constant offsetIsWildcarded = 216;
    uint256 private constant maskParamCount = 0xffff << offsetParamCount;
    uint256 private constant maskOptions = 0xff << offsetOptions;
    uint256 private constant maskIsWildcarded = 0x1 << offsetIsWildcarded;
    // CONDITION:(stored in code at the address kept in header)
    // 8    bits -> parent
    // 3    bits -> type
    // 5    bits -> operator
    uint256 private constant bytesPerCondition = 2;
    uint16 private constant offsetParent = 8;
    uint16 private constant offsetParamType = 5;
    uint16 private constant offsetOperator = 0;
    uint16 private constant maskParent = uint16(0xff << offsetParent);
    uint16 private constant maskParamType = uint16(0x07 << offsetParamType);
    uint16 private constant maskOperator = uint16(0x1f << offsetOperator);

    function packedSize(
        ConditionFlat[] memory conditions
    ) internal pure returns (uint256 result) {
        uint256 paramCount = conditions.length;

        result = paramCount * bytesPerCondition;
        for (uint256 i; i < paramCount; ++i) {
            if (conditions[i].operator >= Operator.EqualTo) {
                result += 32;
            }
        }
    }

    function packHeader(
        uint256 paramCount,
        ExecutionOptions options,
        address pointer
    ) internal pure returns (bytes32 result) {
        result |= bytes32(paramCount << offsetParamCount);
        result |= bytes32(uint256(options)) << offsetOptions;
        result |= bytes32(bytes20(pointer)) >> (12 * 8);
    }

    function packHeaderAsWildcarded(
        ExecutionOptions options
    ) internal pure returns (bytes32) {
        return
            (bytes32(uint256(options)) << offsetOptions) |
            bytes32(maskIsWildcarded);
    }

    function packCondition(
        bytes memory buffer,
        uint256 index,
        ConditionFlat memory condition
    ) internal pure {
        uint16 bits = (uint16(condition.parent) << offsetParent) |
            (uint16(condition.paramType) << offsetParamType) |
            (uint16(condition.operator) << offsetOperator);

        uint256 offset = index * bytesPerCondition;
        buffer[offset] = bytes1(uint8(bits >> 8));
        buffer[offset + 1] = bytes1(uint8(bits));
    }

    function packCompValue(
        bytes memory buffer,
        uint256 offset,
        ConditionFlat memory condition
    ) internal pure {
        bytes32 word = condition.operator == Operator.EqualTo
            ? keccak256(condition.compValue)
            : bytes32(condition.compValue);

        assembly {
            mstore(add(buffer, offset), word)
        }
    }
}
