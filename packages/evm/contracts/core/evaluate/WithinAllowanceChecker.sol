// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AllowanceLoader.sol";
import "../../common/PriceConversion.sol";
import "../../types/Types.sol";

import {Consumption} from "../../types/Allowance.sol";

/**
 * @title WithinAllowanceChecker
 * @notice Validates allowance consumption with optional price conversion.
 *
 * @dev Checks if a value is within an allowance. If a pricing adapter is
 *      provided, the value is converted to the allowance's base denomination.
 *
 * @author gnosisguild
 */
library WithinAllowanceChecker {
    function check(
        Consumption[] memory consumptions,
        uint256 value,
        bytes memory compValue
    ) internal view returns (Status, Consumption[] memory) {
        (Status status, uint128 converted) = _toBaseDenomination(
            value,
            compValue
        );
        if (status != Status.Ok) {
            return (status, consumptions);
        }

        (Consumption memory entry, uint256 index) = _lookup(
            consumptions,
            bytes32(compValue)
        );

        entry.consumed += converted;

        if (entry.consumed <= entry.balance) {
            return (Status.Ok, _put(consumptions, index, entry));
        } else {
            return (Status.AllowanceExceeded, consumptions);
        }
    }

    /**
     * @dev Normalizes a value to the allowance's base denomination via decimal
     *      scaling and applying an exchange rate (via price adapter).
     *
     * It is possible to scale decimals without price conversion by providing
     * `baseDecimals` and `paramDecimals` but no price adapter.
     *
     * @param value The raw amount to be converted.
     * @param compValue Configuration containing decimals and adapter address.
     * @return status Ok if no error ocurred
     * @return converted The converted amount in base denomination
     */
    function _toBaseDenomination(
        uint256 value,
        bytes memory compValue
    ) private view returns (Status, uint128) {
        /**
         * CompValue Layout (32, 34, or 54 bytes):
         * ┌─────────────────────────┬──────────┬──────────┬─────────────────────┐
         * │      allowanceKey       │   base   │  param   │       adapter       │
         * │        (bytes32)        │ decimals │ decimals │      (address)      │
         * ├─────────────────────────┼──────────┼──────────┼─────────────────────┤
         * │         0 - 31          │    32    │    33    │       34 - 53       │
         * └─────────────────────────┴──────────┴──────────┴─────────────────────┘
         *                           └── optional ─────────┴───── optional ──────┘
         *
         * baseDecimals: decimals of the allowance unit (how it accrues)
         * paramDecimals: decimals of the parameter value (from calldata)
         */
        uint256 length = compValue.length;

        // No conversion
        if (length == 32) {
            return (Status.Ok, uint128(value));
        }

        address adapter;
        if (length > 34) {
            assembly {
                adapter := shr(96, mload(add(compValue, 0x42)))
            }
        }

        /*
         * source: paramDecimals
         * target: baseDecimals
         */
        (Status status, uint256 converted) = PriceConversion.convert(
            value,
            uint8(compValue[33]),
            uint8(compValue[32]),
            adapter
        );
        if (status != Status.Ok) {
            return (status, 0);
        }
        return (Status.Ok, uint128(converted));
    }

    /// @dev Finds consumption in array by key, or loads from storage if not
    ///      present. Returns a copy
    function _lookup(
        Consumption[] memory consumptions,
        bytes32 allowanceKey
    ) private view returns (Consumption memory consumption, uint256 index) {
        uint256 length = consumptions.length;

        for (; index < length; ++index) {
            if (consumptions[index].allowanceKey == allowanceKey) break;
        }

        if (index < length) {
            consumption = Consumption(
                allowanceKey,
                consumptions[index].balance,
                consumptions[index].consumed,
                consumptions[index].timestamp
            );
        } else {
            (uint128 balance, uint64 timestamp) = AllowanceLoader.accrue(
                allowanceKey,
                uint64(block.timestamp)
            );
            consumption = Consumption(allowanceKey, balance, 0, timestamp);
        }
    }

    /// @dev Shallow copies array, and writes entry at index.
    function _put(
        Consumption[] memory consumptions,
        uint256 index,
        Consumption memory entry
    ) private pure returns (Consumption[] memory result) {
        uint256 prevLength = consumptions.length;
        uint256 length = prevLength + (index == prevLength ? 1 : 0);

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

        result[index] = entry;
    }
}
