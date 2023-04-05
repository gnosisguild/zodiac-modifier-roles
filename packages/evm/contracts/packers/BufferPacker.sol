// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

/**
 * @title BufferPacker a library that provides packing and unpacking functions
 * for permission conditions. It allows packing externally provided
 * ConditionsFlat[] into a storage-optimized buffer, and later unpack it into
 * memory.
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
    ) internal pure returns (bytes32) {
        return
            bytes32(paramCount << offsetParamCount) |
            (bytes32(uint256(options)) << offsetOptions) |
            bytes32(uint256(uint160(pointer)));
    }

    function packHeaderAsWildcarded(
        ExecutionOptions options
    ) internal pure returns (bytes32) {
        return
            (bytes32(uint256(options)) << offsetOptions) |
            bytes32(maskIsWildcarded);
    }

    function unpackHeader(
        bytes32 header
    ) internal pure returns (uint256 paramCount, address pointer) {
        paramCount = (uint256(header) & maskParamCount) >> offsetParamCount;

        pointer = address(bytes20(uint160(uint256(header))));
    }

    function unpackOptions(
        bytes32 header
    ) internal pure returns (bool isWildcarded, ExecutionOptions options) {
        isWildcarded = uint256(header) & maskIsWildcarded != 0;
        options = ExecutionOptions(
            (uint256(header) & maskOptions) >> offsetOptions
        );
    }

    function packCondition(
        bytes memory buffer,
        uint256 index,
        ConditionFlat memory condition
    ) internal pure {
        uint256 offset = index * bytesPerCondition;
        buffer[offset] = bytes1(condition.parent);
        buffer[offset + 1] = bytes1(
            (uint8(condition.paramType) << uint8(offsetParamType)) |
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
        uint256 paramCount
    )
        internal
        pure
        returns (
            ConditionFlat[] memory result,
            bytes32[] memory compValues,
            uint256 allowanceCount
        )
    {
        result = new ConditionFlat[](paramCount);
        compValues = new bytes32[](paramCount);

        unchecked {
            bytes32 word;
            uint256 offset = 32;
            uint256 compValueOffset = 32 + paramCount * bytesPerCondition;

            for (uint256 i; i < paramCount; ++i) {
                assembly {
                    word := mload(add(buffer, offset))
                }
                offset += bytesPerCondition;

                uint16 bits = uint16(bytes2(word));
                ConditionFlat memory condition = result[i];
                condition.parent = uint8((bits & maskParent) >> offsetParent);
                condition.paramType = ParameterType(
                    (bits & maskParamType) >> offsetParamType
                );
                condition.operator = Operator(bits & maskOperator);

                if (condition.operator >= Operator.EqualTo) {
                    assembly {
                        word := mload(add(buffer, compValueOffset))
                    }
                    compValueOffset += 32;

                    compValues[i] = word;
                    if (condition.operator >= Operator.WithinAllowance) {
                        ++allowanceCount;
                    }
                }
            }
        }
    }
}
