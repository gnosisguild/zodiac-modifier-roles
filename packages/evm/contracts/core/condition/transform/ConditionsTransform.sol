// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./ConditionPacker.sol";
import "./Integrity.sol";
import "./TypeTree.sol";

import "../../../types/Types.sol";

library ConditionsTransform {
    function pack(
        ConditionFlat[] memory conditions
    ) external pure returns (bytes memory) {
        Integrity.enforce(conditions);

        _removeExtraneousOffsets(conditions);

        Layout memory layout = TypeTree.inspect(conditions, 0);

        return ConditionPacker.pack(conditions, layout);
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
        Encoding paramType = conditions[index].paramType;
        if (paramType == Encoding.Static) {
            return true;
        } else if (
            paramType == Encoding.Dynamic ||
            paramType == Encoding.Array ||
            paramType == Encoding.Calldata ||
            paramType == Encoding.AbiEncoded
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
