// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AllowanceLoader.sol";
import "../../common/PriceConversion.sol";
import "../../types/Types.sol";

import {Consumption} from "../../types/Allowance.sol";

/**
 * @title WithinAllowanceChecker
 * @notice Validates allowance consumption with optional amount conversion.
 *
 * @dev Checks if a value is within an allowance and consumes it. The value is
 *      normalized to the allowance's base denomination via decimal scaling
 *      and exchange rate conversion, both optional.
 *
 * @author gnosisguild
 */
library WithinAllowanceChecker {
    function check(
        Consumption[] memory consumptions,
        uint256 value,
        bytes memory compValue
    ) internal view returns (Status status, Consumption[] memory) {
        (status, value) = _convert(value, compValue);
        if (status != Status.Ok) {
            return (status, consumptions);
        }

        (Consumption memory entry, uint256 index) = _lookup(
            consumptions,
            bytes32(compValue)
        );

        if (entry.consumed + value > type(uint128).max) {
            return (Status.AllowanceValueOverflow, consumptions);
        }

        entry.consumed += uint128(value);
        if (entry.consumed <= entry.balance) {
            return (Status.Ok, _put(consumptions, index, entry));
        } else {
            return (Status.AllowanceExceeded, consumptions);
        }
    }

    /**
     * @dev Normalizes a value to the allowance's base denomination.
     *
     *      Converts via decimal scaling and optionally an exchange rate
     *      (via price adapter). Scaling is possible without an adapter by
     *      providing both base and param decimals.
     *
     * @param value The raw amount to be converted.
     * @param compValue Configuration bytes containing decimals and adapter.
     * @return status Result of the conversion (Ok or price adapter error).
     * @return converted Normalized amount in the allowance's base decimals.
     */
    function _convert(
        uint256 value,
        bytes memory compValue
    ) private view returns (Status, uint256) {
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
         * baseDecimals: decimals of the allowance unit  (how it's accounted)
         * paramDecimals: decimals of the parameter value (from calldata)
         */

        if (compValue.length == 32) {
            return (Status.Ok, value);
        }

        uint256 baseDecimals = uint8(compValue[32]);
        uint256 paramDecimals = uint8(compValue[33]);

        // Scale decimals
        if (baseDecimals >= paramDecimals) {
            value = value * (10 ** (baseDecimals - paramDecimals));
        } else {
            value = value / (10 ** (paramDecimals - baseDecimals));
        }

        address adapter;
        if (compValue.length > 34) {
            assembly {
                adapter := shr(96, mload(add(compValue, 0x42)))
            }
        }

        return PriceConversion.convert(value, adapter);
    }

    /**
     * @dev Finds consumption in array by key, or loads from storage if not
     *      present. Always returns a copy
     */
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
