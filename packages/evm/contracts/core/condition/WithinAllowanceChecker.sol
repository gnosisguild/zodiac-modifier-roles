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
    ) internal view returns (bool success, Consumption[] memory) {
        bytes32 allowanceKey = bytes32(compValue);
        uint128 convertedValue = _convert(value, compValue);

        (Consumption[] memory result, uint256 index) = _cloneAndEnsureEntry(
            consumptions,
            allowanceKey
        );

        success =
            result[index].consumed + convertedValue <= result[index].balance;
        if (success) {
            result[index].consumed += convertedValue;
        }
        return (success, result);
    }

    function _convert(
        uint256 value,
        bytes memory compValue
    ) private view returns (uint128) {
        if (compValue.length > 32) {
            CompValue memory config = _unpack(compValue);

            uint256 price = IPriceAdapter(config.adapter).getPrice();

            /*
             *             value × price     10^accrueDecimals
             *   result = ─────────────── × ───────────────────
             *                 10^18          10^paramDecimals
             *
             * (Do all multiplications before division to preserve precision)
             *
             */
            value =
                (value * price * (10 ** config.accrueDecimals)) /
                (10 ** (18 + config.paramDecimals));
        }

        return uint128(value);
    }

    function _cloneAndEnsureEntry(
        Consumption[] memory consumptions,
        bytes32 allowanceKey
    ) private view returns (Consumption[] memory result, uint256 index) {
        for (; index < consumptions.length; ++index) {
            if (consumptions[index].allowanceKey == allowanceKey) break;
        }

        bool found = index < consumptions.length;

        result = _shallowClone(consumptions, !found);

        if (!found) {
            (uint128 balance, uint64 timestamp) = AllowanceLoader.accrue(
                allowanceKey,
                uint64(block.timestamp)
            );
            result[index] = Consumption({
                allowanceKey: allowanceKey,
                balance: balance,
                consumed: 0,
                timestamp: timestamp
            });
        } else {
            result[index] = Consumption({
                allowanceKey: allowanceKey,
                balance: result[index].balance,
                consumed: result[index].consumed,
                timestamp: result[index].timestamp
            });
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
        // Extract adapter address from bytes 32-51
        assembly {
            // compValue pointer + 0x20 (length) + 0x20 (allowanceKey) = 0x40
            mstore(config, shr(96, mload(add(compValue, 0x40))))
        }
        // Extract decimals from bytes 52-53
        config.accrueDecimals = uint8(compValue[52]);
        config.paramDecimals = uint8(compValue[53]);
    }

    struct CompValue {
        address adapter;
        uint8 accrueDecimals;
        uint8 paramDecimals;
    }
}
