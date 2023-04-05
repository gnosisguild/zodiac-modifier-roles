// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

import "./BufferPacker.sol";

/**
 * @title Packer - a library that coordinates the process of packing
 * conditions into a storage optimized buffer.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Packer {
    function pack(
        ConditionFlat[] memory conditions
    ) external pure returns (bytes memory buffer) {
        _removeExtraneousOffsets(conditions);

        buffer = new bytes(BufferPacker.packedSize(conditions));

        uint256 count = conditions.length;
        uint256 offset = 32 + count * 2;
        for (uint256 i; i < count; ++i) {
            BufferPacker.packCondition(buffer, i, conditions[i]);
            if (conditions[i].operator >= Operator.EqualTo) {
                BufferPacker.packCompValue(buffer, offset, conditions[i]);
                offset += 32;
            }
        }
    }

    /**
     * @dev This function removes unnecessary offsets from compValue fields of
     * the `conditions` array. Its purpose is to ensure a consistent API where
     * every `compValue` provided for use in `Operations.EqualsTo` is obtained
     * by calling `abi.encode` directly.
     *
     * By removing the leading extraneous offsets this function makes
     * abi.encode(...) match the output produced by Decoder inspection.
     * Without it, the encoded fields would need to be patched externally
     * depending on whether the payload is fully encoded inline or not.
     *
     * @param conditions Array of ConditionFlat structs to remove extraneous
     * offsets from
     */
    function _removeExtraneousOffsets(
        ConditionFlat[] memory conditions
    ) private pure returns (ConditionFlat[] memory) {
        uint256 count = conditions.length;
        for (uint256 i; i < count; ++i) {
            if (
                conditions[i].operator == Operator.EqualTo &&
                _isInline(conditions, i) == false
            ) {
                bytes memory compValue = conditions[i].compValue;
                uint256 length = compValue.length;
                assembly {
                    compValue := add(compValue, 32)
                    mstore(compValue, sub(length, 32))
                }
                conditions[i].compValue = compValue;
            }
        }
        return conditions;
    }

    function _isInline(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        ParameterType paramType = conditions[index].paramType;
        if (paramType == ParameterType.Static) {
            return true;
        } else if (
            paramType == ParameterType.Dynamic ||
            paramType == ParameterType.Array ||
            paramType == ParameterType.AbiEncoded
        ) {
            return false;
        } else {
            uint256 length = conditions.length;
            unchecked {
                for (uint256 j = index + 1; j < length; ++j) {
                    if (conditions[j].parent != index) {
                        continue;
                    }
                    if (!_isInline(conditions, j)) {
                        return false;
                    }
                }
            }
            return true;
        }
    }
}
