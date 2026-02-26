// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "../periphery/interfaces/IPricing.sol";
import "../types/Types.sol";

/**
 * @title PriceConversion
 * @notice Library for applying exchange rate conversion via IPricing adapters.
 *
 * @dev Converts amounts using an external pricing adapter. The adapter returns
 *      a price with 18 decimals precision. Decimal scaling should be handled
 *      by the caller.
 *
 * @author gnosisguild
 */
library PriceConversion {
    uint256 private constant PRICE_DECIMALS = 18;
    uint256 private constant ONE = 10 ** PRICE_DECIMALS;

    /**
     * @notice Applies exchange rate conversion to an amount.
     * @param amount The amount to convert
     * @param adapter Price adapter address
     * @return status Ok or error status from adapter
     * @return result Amount multiplied by price and divided by 10^18
     */
    function convert(
        uint256 amount,
        address adapter
    ) internal view returns (Status, uint256) {
        (Status status, uint256 price) = _getPrice(adapter);
        if (status != Status.Ok) {
            return (status, 0);
        }

        return (Status.Ok, (amount * price) / ONE);
    }

    /**
     * @dev Safely invokes pricing adapter via staticcall.
     *
     *  Price Adapter (IPricing.getPrice) Error Scenarios:
     *  | Scenario              | staticcall Result     | Behavior                      | Status                          |
     *  |-----------------------|-----------------------|-------------------------------|---------------------------------|
     *  | No code at address    | (true, "")            | extcodesize == 0              | PricingAdapterNotAContract      |
     *  | Wrong interface       | (false, "")           | staticcall fails              | PricingAdapterReverted          |
     *  | Function reverts      | (false, <error data>) | staticcall fails              | PricingAdapterReverted          |
     *  | Returns wrong type    | (true, <len != 32>)   | returnData.length != 32       | PricingAdapterInvalidResult     |
     *  | Returns zero price    | (true, <32 bytes>)    | price == 0                    | PricingAdapterZeroPrice         |
     *
     */

    function _getPrice(address adapter) private view returns (Status, uint256) {
        if (adapter == address(0)) {
            return (Status.Ok, ONE);
        }

        uint256 size;
        assembly {
            size := extcodesize(adapter)
        }
        if (size == 0) {
            return (Status.PricingAdapterNotAContract, 0);
        }

        (bool success, bytes memory returnData) = adapter.staticcall(
            abi.encodeCall(IPricing.getPrice, ())
        );

        if (!success) {
            return (Status.PricingAdapterReverted, 0);
        }

        if (returnData.length != 32) {
            return (Status.PricingAdapterInvalidResult, 0);
        }

        uint256 price = uint256(bytes32(returnData));
        if (price == 0) {
            return (Status.PricingAdapterZeroPrice, 0);
        }

        return (Status.Ok, price);
    }
}
