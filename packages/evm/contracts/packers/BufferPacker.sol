// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

/**
 * @title BufferPacker a library that provides packing and unpacking functions
 * for conditions. It allows packing externally provided ConditionsFlat[] into
 * a storage-optimized buffer, and later unpack it into memory.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library BufferPacker {
    // HEADER (stored as a single word in storage)
    // 2   bytes -> count (Condition count)
    // 1   bytes -> options (ExecutionOptions)
    // 1   bytes -> isWildcarded
    // 8   bytes -> unused
    // 20  bytes -> pointer (address containining packed conditions)
    uint256 private constant OFFSET_COUNT = 240;
    uint256 private constant OFFSET_OPTIONS = 224;
    uint256 private constant OFFSET_IS_WILDCARDED = 216;
    uint256 private constant MASK_COUNT = 0xffff << OFFSET_COUNT;
    uint256 private constant MASK_OPTIONS = 0xff << OFFSET_OPTIONS;
    uint256 private constant MASK_IS_WILDCARDED = 0x1 << OFFSET_IS_WILDCARDED;
    // CONDITION (stored as runtimeBytecode at pointer address kept in header)
    // 8    bits -> parent
    // 3    bits -> type
    // 5    bits -> operator
    uint256 private constant BYTES_PER_CONDITION = 2;
    uint16 private constant OFFSET_PARENT = 8;
    uint16 private constant OFFSET_PARAM_TYPE = 5;
    uint16 private constant OFFSET_OPERATOR = 0;
    uint16 private constant MASK_PARENT = uint16(0xff << OFFSET_PARENT);
    uint16 private constant MASK_PARAM_TYPE = uint16(0x07 << OFFSET_PARAM_TYPE);
    uint16 private constant MASK_OPERATOR = uint16(0x1f << OFFSET_OPERATOR);

    function packedSize(
        ConditionFlat[] memory conditions
    ) internal pure returns (uint256 result) {
        uint256 count = conditions.length;

        result = count * BYTES_PER_CONDITION;
        for (uint256 i; i < count; ++i) {
            if (conditions[i].operator >= Operator.EqualTo) {
                result += 32;
            }
        }
    }

    function packHeader(
        uint256 count,
        ExecutionOptions options,
        address pointer
    ) internal pure returns (bytes32) {
        return
            bytes32(count << OFFSET_COUNT) |
            (bytes32(uint256(options)) << OFFSET_OPTIONS) |
            bytes32(uint256(uint160(pointer)));
    }

    function packHeaderAsWildcarded(
        ExecutionOptions options
    ) internal pure returns (bytes32) {
        return
            bytes32(uint256(options) << OFFSET_OPTIONS) |
            bytes32(MASK_IS_WILDCARDED);
    }

    function unpackHeader(
        bytes32 header
    ) internal pure returns (uint256 count, address pointer) {
        count = (uint256(header) & MASK_COUNT) >> OFFSET_COUNT;
        pointer = address(bytes20(uint160(uint256(header))));
    }

    function unpackOptions(
        bytes32 header
    ) internal pure returns (bool isWildcarded, ExecutionOptions options) {
        isWildcarded = uint256(header) & MASK_IS_WILDCARDED != 0;
        options = ExecutionOptions(
            (uint256(header) & MASK_OPTIONS) >> OFFSET_OPTIONS
        );
    }

    function packCondition(
        bytes memory buffer,
        uint256 index,
        ConditionFlat memory condition
    ) internal pure {
        uint256 offset = index * BYTES_PER_CONDITION;
        buffer[offset] = bytes1(condition.parent);
        buffer[offset + 1] = bytes1(
            (uint8(condition.paramType) << uint8(OFFSET_PARAM_TYPE)) |
                uint8(condition.operator)
        );
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

    function unpackBody(
        bytes memory buffer,
        uint256 count
    )
        internal
        pure
        returns (ConditionFlat[] memory result, bytes32[] memory compValues)
    {
        result = new ConditionFlat[](count);
        compValues = new bytes32[](count);

        bytes32 word;
        uint256 offset = 32;
        uint256 compValueOffset = 32 + count * BYTES_PER_CONDITION;

        for (uint256 i; i < count; ) {
            assembly {
                word := mload(add(buffer, offset))
            }
            offset += BYTES_PER_CONDITION;

            uint16 bits = uint16(bytes2(word));
            ConditionFlat memory condition = result[i];
            condition.parent = uint8((bits & MASK_PARENT) >> OFFSET_PARENT);
            condition.paramType = AbiType(
                (bits & MASK_PARAM_TYPE) >> OFFSET_PARAM_TYPE
            );
            condition.operator = Operator(bits & MASK_OPERATOR);

            if (condition.operator >= Operator.EqualTo) {
                assembly {
                    word := mload(add(buffer, compValueOffset))
                }
                compValueOffset += 32;
                compValues[i] = word;
            }
            unchecked {
                ++i;
            }
        }
    }
}
