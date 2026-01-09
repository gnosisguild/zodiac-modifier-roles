// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/ICustomCondition.sol";
import "../../periphery/interfaces/IPricing.sol";
import "../../types/Types.sol";

/**
 * @title Adapter
 * @notice Safely invokes external adapters via staticcall.
 *
 * ICustomCondition.check error scenarios:
 *   | Scenario              | staticcall Result     | Behavior                      | Status                          |
 *   |-----------------------|-----------------------|-------------------------------|---------------------------------|
 *   | No code at address    | (true, "")            | extcodesize == 0              | CustomConditionNotAContract     |
 *   | Wrong interface       | (false, "")           | staticcall fails              | CustomConditionReverted         |
 *   | Function reverts      | (false, <error data>) | staticcall fails              | CustomConditionReverted         |
 *   | Returns wrong type    | (true, <len != 64>)   | returnData.length != 64       | CustomConditionInvalidResult    |
 *   | Returns (false, info) | (true, <64 bytes>)    | Adapter rejects the condition | CustomConditionViolation        |
 *
 * IPricing.getPrice error scenarios:
 *   | Scenario              | staticcall Result     | Behavior                      | Status                          |
 *   |-----------------------|-----------------------|-------------------------------|---------------------------------|
 *   | No code at address    | (true, "")            | extcodesize == 0              | PricingAdapterNotAContract      |
 *   | Wrong interface       | (false, "")           | staticcall fails              | PricingAdapterReverted          |
 *   | Function reverts      | (false, <error data>) | staticcall fails              | PricingAdapterReverted          |
 *   | Returns wrong type    | (true, <len != 32>)   | returnData.length != 32       | PricingAdapterInvalidResult     |
 *   | Returns zero price    | (true, <32 bytes>)    | price == 0                    | PricingAdapterZeroPrice         |
 */
library Adapter {
    function check(
        address adapterAddress,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 location,
        uint256 size,
        bytes memory extra,
        bytes32[] memory pluckedValues
    ) internal view returns (Status, bytes32) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(adapterAddress)
        }
        if (codeSize == 0) {
            return (Status.CustomConditionNotAContract, 0);
        }

        (bool callSuccess, bytes memory returnData) = adapterAddress.staticcall(
            abi.encodeCall(
                ICustomCondition.check,
                (
                    to,
                    value,
                    data,
                    operation,
                    location,
                    size,
                    extra,
                    pluckedValues
                )
            )
        );

        if (!callSuccess) {
            return (Status.CustomConditionReverted, 0);
        }

        if (returnData.length != 64) {
            return (Status.CustomConditionInvalidResult, 0);
        }

        (bool success, bytes32 info) = abi.decode(returnData, (bool, bytes32));
        if (!success) {
            return (Status.CustomConditionViolation, info);
        }

        return (Status.Ok, info);
    }

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
