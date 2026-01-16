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
     * @dev Transforms conditions in-place for packing (mutates for gas efficiency)
     */
    function transform(
        ConditionFlat[] memory conditions,
        TopologyInfo[] memory info
    ) internal pure {
        uint256 count = conditions.length;
        for (uint256 i; i < count; ++i) {
            /*
             * Patch EtherValue
             *
             * Patch EtherValue encoding to None after Integrity validation.
             * This enables downstream detection via payload.size == 0, when
             * retrieving input.
             */
            if (conditions[i].paramType == Encoding.EtherValue) {
                conditions[i].paramType = Encoding.None;
            }

            /*
             *
             * Remove Extraneous Offsets
             *
             * Remove unnecessary offsets from compValue fields. This ensures a
             * consistent API where every `compValue` provided for use in
             * `Operator.EqualTo` is obtained by calling `abi.encode` directly.
             *
             * By removing the leading extraneous offset this makes
             * `abi.encode(...)` output line up with the layout produced by
             * Decoder inspection. Without it, callers would need to patch
             * compValues based on whether the payload is fully inline or at
             * offset.
             */
            if (
                conditions[i].operator == Operator.EqualTo && info[i].atOffset
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
}
