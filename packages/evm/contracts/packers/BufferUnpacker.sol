// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

/**
 * @title BufferUnpacker a library that provides unpacking functions for
 * permission. It unpacks conditions from the optimized storage format into
 * memory.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library BufferUnpacker {
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

    function unpackHeader(
        bytes32 header
    ) internal pure returns (uint256 paramCount, address pointer) {
        paramCount = (uint256(header) & maskParamCount) >> offsetParamCount;

        pointer = address(bytes20(uint160(uint256(header))));
        pointer = address(bytes20(header << (12 * 8)));
    }

    function unpackOptions(
        bytes32 header
    ) internal pure returns (bool isWildcarded, ExecutionOptions options) {
        isWildcarded = uint256(header) & maskIsWildcarded != 0;
        options = ExecutionOptions(
            (uint256(header) & maskOptions) >> offsetOptions
        );
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
            uint256 compValueOffset = 32 + paramCount * bytesPerCondition;
            for (uint256 i; i < paramCount; ++i) {
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
                condition.operator = Operator(bits & maskOperator);

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
            }
        }
    }
}
