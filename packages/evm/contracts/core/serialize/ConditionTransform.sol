// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title ConditionTransform
 * @notice Normalizes condition trees before packing.
 *
 * @author gnosisguild
 */
library ConditionTransform {
    /**
     * @notice Transforms conditions in-place for packing.
     *         - Patches EtherValue encoding to None
     *         - Removes extraneous offsets from compValue fields
     *
     * @param conditions The flat condition array to transform (modified
     *                   in-place).
     */
    function transform(ConditionFlat[] memory conditions) internal pure {
        _patchEtherValue(conditions);
        _removeExtraneousOffsets(conditions);
    }

    /**
     * @dev Patches EtherValue encoding to None after Integrity validation.
     *      This enables downstream detection via payload.size == 0.
     */
    function _patchEtherValue(ConditionFlat[] memory conditions) private pure {
        uint256 count = conditions.length;
        for (uint256 i; i < count; ++i) {
            if (conditions[i].paramType == Encoding.EtherValue) {
                conditions[i].paramType = Encoding.None;
            }
        }
    }

    /**
     * @dev Removes unnecessary offsets from compValue fields of the conditions
     * array. Its purpose is to ensure a consistent API where every `compValue`
     * provided for use in `Operations.EqualTo` is obtained by calling
     * `abi.encode` directly.
     *
     * By removing the leading extraneous offsets this function makes
     * `abi.encode(...)` output line up with the layout produced by Decoder
     * inspection. Without it, callers would need to patch compValues
     * based on whether the payload is fully inline or at offset.
     *
     * @param conditions Array of ConditionFlat structs to normalize
     */
    function _removeExtraneousOffsets(
        ConditionFlat[] memory conditions
    ) private pure {
        uint256 count = conditions.length;
        for (uint256 i; i < count; ++i) {
            if (
                conditions[i].operator == Operator.EqualTo &&
                !_isInline(conditions, i)
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
    }

    /**
     * @dev Returns true when the encoded parameter is stored inline (no ABI
     *      offset), recursing through tuple children to ensure every leaf is
     *      inline as well.
     */
    function _isInline(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        Encoding paramType = conditions[index].paramType;
        if (paramType == Encoding.Static) {
            return true;
        } else if (
            paramType == Encoding.Dynamic ||
            paramType == Encoding.Array ||
            paramType == Encoding.AbiEncoded
        ) {
            return false;
        } else {
            // Tuple: check all children recursively
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
