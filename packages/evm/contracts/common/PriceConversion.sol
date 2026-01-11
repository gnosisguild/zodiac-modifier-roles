// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../periphery/interfaces/IPricing.sol";
import "../types/Types.sol";

/**
 * @title PriceConversion
 * @notice Library for decimal normalization and exchange rate conversion.
 *
 * @dev Converts amounts between decimal precisions. If a pricing adapter
 *      is provided, it is safely invoked via staticcall to obtain the exchange
 *      rate.
 *
 * @author gnosisguild
 */
library PriceConversion {
    uint256 internal constant PRICE_DECIMALS = 18;

    /**
     * @notice Converts amount from source to target decimals, applying price if adapter provided.
     * @param amount Raw amount in source decimals
     * @param sourceDecimals Decimals of the input amount
     * @param targetDecimals Decimals of the output amount
     * @param adapter Price adapter address (address(0) for no price conversion)
     * @return status Ok or error status from adapter
     * @return result Converted amount in target decimals
     */
    function convert(
        uint256 amount,
        uint256 sourceDecimals,
        uint256 targetDecimals,
        address adapter
    ) internal view returns (Status, uint256 result) {
        bool scaleUp = targetDecimals >= sourceDecimals;
        uint256 delta = scaleUp
            ? targetDecimals - sourceDecimals
            : sourceDecimals - targetDecimals;

        // No price conversion needed
        if (adapter == address(0)) {
            result = scaleUp ? amount * (10 ** delta) : amount / (10 ** delta);
            return (Status.Ok, result);
        }

        // Apply price conversion
        (Status status, uint256 price) = _getPrice(adapter);
        if (status != Status.Ok) {
            return (status, 0);
        }

        // Multiply first, divide after to preserve precision
        if (scaleUp) {
            result = (amount * (10 ** delta) * price) / (10 ** PRICE_DECIMALS);
        } else {
            result = (amount * price) / (10 ** (PRICE_DECIMALS + delta));
        }

        return (Status.Ok, result);
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
