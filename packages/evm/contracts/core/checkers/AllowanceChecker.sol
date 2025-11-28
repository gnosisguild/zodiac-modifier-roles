// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../AllowanceLoader.sol";

import "../../periphery/interfaces/IPriceAdapter.sol";

/**
 * @title AllowanceChecker
 * @notice Validates allowance consumption with optional price conversion.
 *
 * @dev When a price adapter is used, the spent amount is converted into the
 *      allowance’s base denomination. `accrueDecimals` defines the decimals of
 *      that base unit, and `paramDecimals` defines the decimals of the asset
 *      being spent. This allows multiple assets (with different decimals) to be
 *      aggregated under a single denominated allowance.
 *
 * @author gnosisguild
 */

library AllowanceChecker {
    struct CompValue {
        bytes32 allowanceKey;
        address adapter;
        uint8 accrueDecimals;
        uint8 paramDecimals;
    }

    function check(
        uint256 value,
        bytes memory compValue,
        Consumption[] memory consumptions
    ) internal view returns (bool success, Consumption[] memory) {
        CompValue memory config = _unpack(compValue);

        /*
         * Apply price conversion if adapter is provided
         * Convert `value` expressed in the allowance’s base denomination
         */
        if (config.adapter != address(0)) {
            uint256 price = IPriceAdapter(config.adapter).getPrice();
            value =
                (value * price * (10 ** config.accrueDecimals)) /
                (10 ** (18 + config.paramDecimals));
        }

        return check(value, config.allowanceKey, consumptions);
    }

    function check(
        uint256 value,
        bytes32 allowanceKey,
        Consumption[] memory consumptions
    ) internal view returns (bool success, Consumption[] memory) {
        uint256 index;

        // Find in consumptions
        for (; index < consumptions.length; ++index) {
            if (consumptions[index].allowanceKey == allowanceKey) break;
        }

        uint128 balance;
        uint64 timestamp;
        uint128 consumed;
        if (index < consumptions.length) {
            balance = consumptions[index].balance;
            timestamp = consumptions[index].timestamp;
            consumed = consumptions[index].consumed;
        } else {
            (balance, timestamp) = AllowanceLoader.accrue(
                allowanceKey,
                uint64(block.timestamp)
            );
        }

        if (value + consumed > balance) {
            return (false, consumptions);
        }

        consumptions = _shallowClone(
            consumptions,
            index == consumptions.length
        );
        consumptions[index] = Consumption({
            allowanceKey: allowanceKey,
            balance: balance,
            consumed: consumed + uint128(value),
            timestamp: timestamp
        });

        return (true, consumptions);
    }

    /**
     * @dev Unpacks compValue bytes into CompValue struct.
     *
     * CompValue Layout (32 or 54 bytes):
     * ┌─────────────────────────┬─────────────────────┬──────────┬──────────┐
     * │      allowanceKey       │       adapter       │  accrue  │  param   │
     * │        (bytes32)        │      (address)      │ decimals │ decimals │
     * ├─────────────────────────┼─────────────────────┼──────────┼──────────┤
     * │         0 - 31          │       32 - 51       │    52    │    53    │
     * └─────────────────────────┴─────────────────────┴──────────┴──────────┘
     *                           └─────────────── optional ─────────────────┘
     */
    function _unpack(
        bytes memory compValue
    ) private pure returns (CompValue memory config) {
        config.allowanceKey = bytes32(compValue);

        if (compValue.length > 32) {
            // Extract adapter address from bytes 32-51
            assembly {
                // compValue pointer + 0x20 (length) + 0x20 (allowanceKey) = 0x40
                mstore(add(config, 0x20), shr(96, mload(add(compValue, 0x40))))
            }
            // Extract decimals from bytes 52-53
            config.accrueDecimals = uint8(compValue[52]);
            config.paramDecimals = uint8(compValue[53]);
        }
    }

    /**
     * @dev Returns a shallow clone of `consumptions`. If `extend` is true,
     * the new array has length + 1.
     */
    function _shallowClone(
        Consumption[] memory consumptions,
        bool extend
    ) private pure returns (Consumption[] memory result) {
        uint256 prevLength = consumptions.length;
        uint256 nextLength = prevLength + (extend ? 1 : 0);

        assembly {
            result := mload(0x40)
            mstore(0x40, add(result, mul(add(nextLength, 1), 0x20)))

            mstore(result, nextLength)

            let dst := add(result, 0x20)
            let src := add(consumptions, 0x20)
            let size := mul(prevLength, 0x20)
            mcopy(dst, src, size)
        }
    }
}
