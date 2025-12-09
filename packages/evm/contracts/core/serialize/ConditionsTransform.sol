// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/ImmutableStorage.sol";

import "./ConditionPacker.sol";
import "./Integrity.sol";
import "./TypeTree.sol";

import "../../types/Types.sol";

/**
 * @title ConditionsTransform
 * @notice Validates, transforms, and stores condition trees as immutable bytecode
 *         that can later be loaded without additional overhead.
 * @author gnosisguild
 */
library ConditionsTransform {
    /**
     * @notice Ensures a breadth-first condition tree is well-formed, packs it
     *         and stores the packed bytes as immutable bytecode.
     *
     * @param conditions The flat condition array in BFS order.
     * @return pointer Address of the contract where the packed conditions are stored.
     */
    function packAndStore(
        ConditionFlat[] memory conditions
    ) external returns (address) {
        Integrity.enforce(conditions);

        _removeExtraneousOffsets(conditions);

        Layout memory layout = TypeTree.inspect(conditions, 0);
        bytes memory buffer = ConditionPacker.pack(conditions, layout);
        address pointer = ImmutableStorage.store(buffer);

        return pointer;
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
            paramType == Encoding.Calldata ||
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
