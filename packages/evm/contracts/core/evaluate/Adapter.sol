// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/IPricing.sol";
import "../../types/Types.sol";

/**
 * @title Adapter
 * @notice Safely invokes pricing adapters via staticcall.
 *
 * @dev IPricing.getPrice error scenarios:
 *   | Scenario              | staticcall Result     | Behavior                      | Status                          |
 *   |-----------------------|-----------------------|-------------------------------|---------------------------------|
 *   | No code at address    | (true, "")            | extcodesize == 0              | PricingAdapterNotAContract      |
 *   | Wrong interface       | (false, "")           | staticcall fails              | PricingAdapterReverted          |
 *   | Function reverts      | (false, <error data>) | staticcall fails              | PricingAdapterReverted          |
 *   | Returns wrong type    | (true, <len != 32>)   | returnData.length != 32       | PricingAdapterInvalidResult     |
 *   | Returns zero price    | (true, <32 bytes>)    | price == 0                    | PricingAdapterZeroPrice         |
 *
 * @author gnosisguild
 */
library Adapter {
    function getPrice(
        address adapterAddress
    ) internal view returns (Status, uint256) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(adapterAddress)
        }
        if (codeSize == 0) {
            return (Status.PricingAdapterNotAContract, 0);
        }

        (bool callSuccess, bytes memory returnData) = adapterAddress.staticcall(
            abi.encodeCall(IPricing.getPrice, ())
        );

        if (!callSuccess) {
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
