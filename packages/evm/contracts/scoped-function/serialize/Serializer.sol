// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Integrity.sol";
import "./Packer.sol";
import "./TypeTree.sol";

import "../ImmutableStorage.sol";
import "../ScopeConfig.sol";

import "../../types/All.sol";

library Serializer {
    function store(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) external returns (bytes32) {
        Integrity.enforce(conditions);

        _removeExtraneousOffsets(conditions);

        Layout memory layout = TypeTree.inspect(conditions, 0);
        bytes32[] memory allowanceKeys = _allowanceKeys(conditions);

        bytes memory buffer = Packer.pack(conditions, layout, allowanceKeys);

        return ScopeConfig.pack(options, ImmutableStorage.store(buffer));
    }

    function _allowanceKeys(
        ConditionFlat[] memory conditions
    ) private pure returns (bytes32[] memory result) {
        uint256 maxCount;
        for (uint256 i; i < conditions.length; ++i) {
            if (conditions[i].operator >= Operator.WithinAllowance) maxCount++;
        }

        result = new bytes32[](maxCount);
        uint256 count;

        for (uint256 i; i < conditions.length; ++i) {
            if (conditions[i].operator < Operator.WithinAllowance) {
                continue;
            }
            bytes32 key = bytes32(conditions[i].compValue);
            bool fresh = true;
            for (uint256 j; j < count; ++j) {
                if (result[j] == key) {
                    fresh = false;
                    break;
                }
            }
            if (fresh) {
                result[count++] = key;
            }
        }

        // Truncate result length in-place
        assembly {
            mstore(result, count)
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
