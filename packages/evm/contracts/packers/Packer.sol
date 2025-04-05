// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Modifier.sol";

import "./BufferPacker.sol";

/**
 * @title Packer - a library that coordinates the process of packing
 * conditionsFlat into a storage optimized buffer.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Packer {
    function pack(
        ConditionFlat[] memory conditionsFlat
    ) external pure returns (bytes memory buffer) {
        _removeExtraneousOffsets(conditionsFlat);

        buffer = new bytes(BufferPacker.packedSize(conditionsFlat));

        uint256 count = conditionsFlat.length;
        uint256 offset = 32 + count * 2;
        for (uint256 i; i < count; ++i) {
            BufferPacker.packCondition(buffer, i, conditionsFlat[i]);
            if (conditionsFlat[i].operator >= Operator.EqualTo) {
                BufferPacker.packCompValue(buffer, offset, conditionsFlat[i]);
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
     * @param conditionsFlat Array of ConditionFlat structs to remove extraneous
     * offsets from
     */
    function _removeExtraneousOffsets(
        ConditionFlat[] memory conditionsFlat
    ) private pure {
        uint256 count = conditionsFlat.length;
        for (uint256 i; i < count; ++i) {
            if (
                conditionsFlat[i].operator == Operator.EqualTo &&
                !_isInline(conditionsFlat, i)
            ) {
                bytes memory compValue = conditionsFlat[i].compValue;
                uint256 length = compValue.length;
                assembly {
                    compValue := add(compValue, 32)
                    mstore(compValue, sub(length, 32))
                }
                conditionsFlat[i].compValue = compValue;
            }
        }
    }

    function _isInline(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        AbiType paramType = conditions[index].paramType;
        if (paramType == AbiType.Static) {
            return true;
        } else if (
            paramType == AbiType.Dynamic ||
            paramType == AbiType.Array ||
            paramType == AbiType.Calldata ||
            paramType == AbiType.AbiEncoded
        ) {
            return false;
        } else {
            uint256 length = conditions.length;

            for (uint256 j = index + 1; j < length; ++j) {
                uint8 parent = conditions[j].parent;
                if (parent < index) {
                    continue;
                }

                if (parent > index) {
                    break;
                }

                if (!_isInline(conditions, j)) {
                    return false;
                }
            }
            return true;
        }
    }
}
