// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AllowanceLoader.sol";
import "../../common/ConsumptionList.sol";
import "../../common/PriceConversion.sol";
import "../../types/Types.sol";

import {Consumption} from "../../types/Allowance.sol";

/**
 * @title WithinAllowanceChecker
 * @notice Validates allowance consumption with optional amount conversion.
 *
 * @dev Checks if a value is within an allowance and consumes it. The value is
 *      normalized to the allowance's base denomination via decimal scaling
 *      and/or exchange rate conversion.
 *
 *      The `consumptions` array is treated as immutable. If consumption occurs,
 *      a new array is allocated and returned (Copy-on-Write).
 *
 * @author gnosisguild
 */
library WithinAllowanceChecker {
    function check(
        Consumption[] memory consumptions,
        uint256 value,
        bytes memory compValue
    ) internal view returns (Status status, Consumption[] memory) {
        bytes32 allowanceKey = bytes32(compValue);

        // 1. Convert value to base denomination
        (status, value) = _convert(value, compValue);
        if (status != Status.Ok) {
            return (status, consumptions);
        }

        // 2. Find in list
        uint256 index;
        for (; index < consumptions.length; ++index) {
            if (consumptions[index].allowanceKey == allowanceKey) break;
        }

        // 3. Copy existing or load from storage
        Consumption memory consumption;
        if (index < consumptions.length) {
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

        // 4. Check overflow before consuming
        if (consumption.consumed + value > type(uint128).max) {
            return (Status.AllowanceValueOverflow, consumptions);
        }

        // 5. Consume
        consumption.consumed += uint128(value);

        // 6. Check balance
        if (consumption.consumed > consumption.balance) {
            return (Status.AllowanceExceeded, consumptions);
        }

        // 7. Return updated list
        return (
            Status.Ok,
            ConsumptionList.copyOnWrite(consumptions, consumption, index)
        );
    }

    /**
     * @dev Normalizes a value to the allowance's base denomination.
     *
     *      Calculates the final amount via decimal scaling and optionally
     *      an exchange rate (via price adapter). Scaling is possible without
     *      an adapter by providing both base and param decimals.
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
}
