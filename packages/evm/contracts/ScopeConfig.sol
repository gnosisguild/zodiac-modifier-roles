// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title ScopeConfig a library that provides packing and unpacking functions
 * for permission conditions. Specifically, it allows packing externally
 * provided ConditionsFlat[] into a storage-optimized buffer, and later unpack
 * it into Conditions[] in memory.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 */
library ScopeConfig {
    // HEADER (stored as a single word in storage)
    // 8   bits  -> length (Condition count)
    // 2   bits  -> options (ExecutionOptions)
    // 1   bits  -> isWildcarded
    // 5   bits  -> unused
    // 20  bytes -> address that contains packed conditions
    uint256 private constant offsetLength = 248;
    uint256 private constant offsetOptions = 246;
    uint256 private constant offsetIsWildcarded = 245;
    uint256 private constant maskLength = 0xff << offsetLength;
    uint256 private constant maskOptions = 0x3 << offsetOptions;
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
        for (uint256 i; i < paramCount; ) {
            if (conditions[i].operator >= Operator.EqualTo) {
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

    function packCondition(
        bytes memory buffer,
        uint256 index,
        ConditionFlat memory condition
    ) internal pure {
        uint16 bits = (uint16(condition.parent) << offsetParent) |
            (uint16(condition.paramType) << offsetParamType) |
            (uint16(condition.operator) << offsetOperator);

        uint256 offset = index * bytesPerCondition;
        unchecked {
            buffer[offset] = bytes1(uint8(bits >> 8));
            buffer[offset + 1] = bytes1(uint8(bits));
        }
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

    function unpack(
        bytes memory buffer,
        uint256 count
    )
        internal
        pure
        returns (
            ConditionFlat[] memory result,
            bytes32[] memory compValues,
            uint256 allowanceCount
        )
    {
        result = new ConditionFlat[](count);
        compValues = new bytes32[](count);

        uint256 compValueOffset = 32 + count * bytesPerCondition;
        for (uint256 i; i < count; ) {
            bytes32 word;
            uint256 offset = 32 + i * bytesPerCondition;
            assembly {
                word := mload(add(buffer, offset))
            }
            uint16 bits = uint16(bytes2(word));

            ConditionFlat memory condition = result[i];
            condition.parent = uint8((bits & maskParent) >> offsetParent);
            condition.paramType = ParameterType(
                (bits & maskParamType) >> offsetParamType
            );
            condition.operator = Operator(
                (bits & maskOperator) >> offsetOperator
            );

            if (condition.operator >= Operator.EqualTo) {
                assembly {
                    word := mload(add(buffer, compValueOffset))
                }
                compValues[i] = word;
                compValueOffset += 32;
                if (condition.operator >= Operator.WithinAllowance) {
                    ++allowanceCount;
                }
            }

            unchecked {
                ++i;
            }
        }
    }
}
