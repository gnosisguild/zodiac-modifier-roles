// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AllowanceLoader.sol";
import "../../common/ConsumptionList.sol";
import "../../common/PriceLoader.sol";
import "../../types/Types.sol";

import {Consumption} from "../../types/Allowance.sol";

/**
 * @title WithinAllowanceChecker
 * @notice Validates allowance consumption with optional amount conversion.
 *
 * @dev Checks if a value is within an allowance and consumes it. Values are
 *      compared at the highest required precision and only scaled back down
 *      when the consumption is recorded.
 *
 *      The `consumptions` array is treated as immutable. If consumption occurs,
 *      a new array is allocated and returned (Copy-on-Write).
 *
 * @author gnosisguild
 */
library WithinAllowanceChecker {
    /**
     * CompValue Layout (32, 34, 54, or 54+ bytes):
     * ┌─────────────────────────┬──────────┬──────────┬─────────────────────┬─────────────────────┐
     * │      allowanceKey       │ balance  │  input   │       adapter       │    adapterParams    │
     * │        (bytes32)        │ decimals │ decimals │      (address)      │       (bytes)       │
     * ├─────────────────────────┼──────────┼──────────┼─────────────────────┼─────────────────────┤
     * │         0 - 31          │    32    │    33    │       34 - 53       │        54+          │
     * └─────────────────────────┴──────────┴──────────┴─────────────────────┴─────────────────────┘
     *                           └── optional ─────────┴───── optional ──────┴──── optional ───────┘
     *
     * balanceDecimals: decimals used to track the allowance balance
     * inputDecimals: decimals of the value being checked
     * adapterParams: optional trailing bytes passed to IPricing.getPrice(params)
     */
    function check(
        Consumption[] memory consumptions,
        uint256 value,
        bytes memory compValue
    ) internal view returns (Status status, Consumption[] memory) {
        bytes32 allowanceKey = bytes32(compValue);

        // 1. Find the current consumption or load its accrued allowance
        (Consumption memory consumption, uint256 index) = _findConsumption(
            consumptions,
            allowanceKey
        );

        // 2. Convert and scale up the input value
        (status, value) = _convertAndScaleInput(value, compValue);
        if (status != Status.Ok) {
            return (status, consumptions);
        }

        // 3. Scale the stored values to the input's precision, and add the
        //    input to the consumed amount
        uint256 balance = _scaleBalance(consumption.balance, compValue);
        uint256 consumed = _scaleBalance(consumption.consumed, compValue) +
            value;

        // 4. Check the allowance at highest level precision
        if (consumed > balance) {
            return (Status.AllowanceExceeded, consumptions);
        }

        // 5. Scale consumption down to the allowance's balance precision,
        //    and round up the division. Fits uint128: the check above caps
        //    it at balance.
        consumption.consumed = uint128(_unscale(consumed, compValue));

        // 6. Return updated list
        return (
            Status.Ok,
            ConsumptionList.copyOnWrite(consumptions, consumption, index)
        );
    }

    /**
     * @dev Scales an input value to the highest decimal precision, applying
     *      the price and retaining its 18-decimal factor.
     */
    function _convertAndScaleInput(
        uint256 value,
        bytes memory compValue
    ) private view returns (Status status, uint256) {
        // A 32-byte compValue contains only the allowance key, so the input is
        // already denominated in balance units and needs no conversion.
        if (compValue.length == 32) {
            return (Status.Ok, value);
        }

        (, uint256 inputDecimals, uint256 precision) = _unpack(compValue);

        address adapter;
        if (compValue.length > 34) {
            assembly {
                adapter := shr(96, mload(add(compValue, 0x42)))
            }
        }

        bytes memory params;
        if (compValue.length > 54) {
            uint256 length = compValue.length - 54;
            params = new bytes(length);
            assembly {
                // 0x56 = 0x20 (memory length prefix) + 0x36 (byte 54)
                mcopy(add(params, 0x20), add(compValue, 0x56), length)
            }
        }

        uint256 price;
        (status, price) = PriceLoader.load(adapter, params);
        if (status != Status.Ok) {
            return (status, 0);
        }

        return (Status.Ok, value * (10 ** (precision - inputDecimals)) * price);
    }

    /**
     * @dev Scales a balance-denominated value to the comparison precision.
     *      Includes the price's 1e18 scale so comparison happens without loss.
     */
    function _scaleBalance(
        uint256 value,
        bytes memory compValue
    ) private pure returns (uint256) {
        if (compValue.length == 32) return value;

        (uint256 balanceDecimals, , uint256 precision) = _unpack(compValue);

        return value * (10 ** (precision - balanceDecimals)) * 1e18;
    }

    /**
     * @dev Scales a comparison value down to balance decimals.
     *      Scaling 1 produces the exact inverse factor required to unscale.
     *
     *      Important: since this is the value used in allowance accrual,
     *      we round up dust.
     */
    function _unscale(
        uint256 value,
        bytes memory compValue
    ) private pure returns (uint256) {
        return _ceilDiv(value, _scaleBalance(1, compValue));
    }

    function _findConsumption(
        Consumption[] memory consumptions,
        bytes32 allowanceKey
    ) private view returns (Consumption memory consumption, uint256 index) {
        for (; index < consumptions.length; ++index) {
            if (consumptions[index].allowanceKey == allowanceKey) break;
        }

        if (index < consumptions.length) {
            consumption = consumptions[index];
            return (
                Consumption(
                    allowanceKey,
                    consumption.balance,
                    consumption.consumed,
                    consumption.timestamp
                ),
                index
            );
        }

        (uint128 balance, uint64 timestamp) = AllowanceLoader.accrue(
            allowanceKey,
            uint64(block.timestamp)
        );
        return (Consumption(allowanceKey, balance, 0, timestamp), index);
    }

    function _unpack(
        bytes memory compValue
    )
        private
        pure
        returns (
            uint256 balanceDecimals,
            uint256 inputDecimals,
            uint256 precision
        )
    {
        balanceDecimals = uint8(compValue[32]);
        inputDecimals = uint8(compValue[33]);
        precision = balanceDecimals > inputDecimals
            ? balanceDecimals
            : inputDecimals;
    }

    /// @dev Ceiling division. Returns 0 for 0, otherwise ⌈a / b⌉.
    function _ceilDiv(uint256 a, uint256 b) private pure returns (uint256) {
        if (a == 0) return 0;
        return (a - 1) / b + 1;
    }
}
