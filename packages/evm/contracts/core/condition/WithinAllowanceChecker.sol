// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../allowance/AllowanceLoader.sol";
import "../../periphery/interfaces/IPriceAdapter.sol";

import {Consumption} from "../../types/Allowance.sol";

/**
 * @title WithinAllowanceChecker
 * @notice Validates allowance consumption with optional price conversion.
 *
 * @dev When a price adapter is used, the spent amount is converted into the
 *      allowance's base denomination. This conversion accounts for two
 *      distinct decimal domains:
 *
 *      • accrueDecimals — decimals of the allowance's base unit
 *      • paramDecimals  — decimals of the asset being spent
 *
 *      This allows multiple assets with different decimal formats to be
 *      aggregated under a single allowance.
 *
 * @author gnosisguild
 */
library WithinAllowanceChecker {
    function check(
        Consumption[] memory consumptions,
        uint256 value,
        bytes memory compValue
    ) internal view returns (bool success, Consumption[] memory result) {
        uint128 amount = _convert(value, compValue);

        uint256 index;
        (result, index) = _prepareConsumptions(
            consumptions,
            bytes32(compValue)
        );

        success = result[index].consumed + amount <= result[index].balance;
        if (success) result[index].consumed += amount;
    }

    /// @dev Converts value to base denomination via price adapter, if configured.
    function _convert(
        uint256 value,
        bytes memory compValue
    ) private view returns (uint128) {
        /**
         * CompValue Layout (32 or 54 bytes):
         * ┌─────────────────────────┬─────────────────────┬──────────┬──────────┐
         * │      allowanceKey       │       adapter       │  accrue  │  param   │
         * │        (bytes32)        │      (address)      │ decimals │ decimals │
         * ├─────────────────────────┼─────────────────────┼──────────┼──────────┤
         * │         0 - 31          │       32 - 51       │    52    │    53    │
         * └─────────────────────────┴─────────────────────┴──────────┴──────────┘
         *                           └─────────────── optional ─────────────────┘
         */
        if (compValue.length > 32) {
            address adapter;
            assembly {
                adapter := shr(96, mload(add(compValue, 0x40)))
            }
            uint8 accrueDecimals = uint8(compValue[52]);
            uint8 paramDecimals = uint8(compValue[53]);

            uint256 price = IPriceAdapter(adapter).getPrice();

            /*
             *             value × price     10^accrueDecimals
             *   result = ─────────────── × ───────────────────
             *                 10^18          10^paramDecimals
             */
            value =
                (value * price * (10 ** accrueDecimals)) /
                (10 ** (18 + paramDecimals));
        }

        return uint128(value);
    }

    /// @dev Clones the array and returns a mutable entry for the given key.
    function _prepareConsumptions(
        Consumption[] memory consumptions,
        bytes32 allowanceKey
    ) private view returns (Consumption[] memory result, uint256 index) {
        Consumption memory entry;
        (entry, index) = _loadEntry(consumptions, allowanceKey);
        result = _shallowClone(consumptions, consumptions.length == index);
        result[index] = entry;
    }

    /// @dev Finds existing entry or creates new one from storage.
    function _loadEntry(
        Consumption[] memory consumptions,
        bytes32 allowanceKey
    ) private view returns (Consumption memory entry, uint256 index) {
        uint256 length = consumptions.length;

        for (; index < length; ++index) {
            if (consumptions[index].allowanceKey == allowanceKey) break;
        }

        if (index < length) {
            Consumption memory c = consumptions[index];
            entry = Consumption(
                c.allowanceKey,
                c.balance,
                c.consumed,
                c.timestamp
            );
        } else {
            (uint128 balance, uint64 timestamp) = AllowanceLoader.accrue(
                allowanceKey,
                uint64(block.timestamp)
            );
            entry = Consumption(allowanceKey, balance, 0, timestamp);
        }
    }

    function _shallowClone(
        Consumption[] memory consumptions,
        bool extend
    ) private pure returns (Consumption[] memory result) {
        uint256 prevLength = consumptions.length;
        uint256 length = prevLength + (extend ? 1 : 0);

        assembly {
            // Load the free memory pointer
            result := mload(0x40)

            // allocate array, by advancing free memory pointer
            mstore(0x40, add(result, mul(add(length, 1), 0x20)))

            // Store the new array length
            mstore(result, length)

            // Copy the previous elements (shallow copy of pointers)
            let dst := add(result, 0x20)
            let src := add(consumptions, 0x20)
            let size := mul(prevLength, 0x20)
            mcopy(dst, src, size)
        }
    }
}
