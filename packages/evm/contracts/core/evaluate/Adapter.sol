// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/ICustomCondition.sol";
import "../../types/Types.sol";

/**
 * @title Adapter
 * @notice Safely invokes external custom condition adapters (ICustomCondition).
 *
 *   | Adapter Error Scenario | staticcall Result     | Behavior                      | Status                          |
 *   |------------------------|-----------------------|-------------------------------|---------------------------------|
 *   | No code at address     | (true, "")            | extcodesize == 0              | CustomConditionNotAContract     |
 *   | Wrong interface        | (false, "")           | staticcall fails              | CustomConditionReverted         |
 *   | Function reverts       | (false, <error data>) | staticcall fails              | CustomConditionReverted         |
 *   | Returns wrong type     | (true, <len != 64>)   | returnData.length != 64       | CustomConditionInvalidResult    |
 *   | Returns (false, info)  | (true, <64 bytes>)    | Adapter rejects the condition | CustomConditionViolation        |
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
        // Check if adapter is a contract
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(adapterAddress)
        }
        if (codeSize == 0) {
            return (Status.CustomConditionNotAContract, 0);
        }

        // Use low-level staticcall to distinguish between revert and invalid result
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

        // Expected return: (bool, bytes32) = 64 bytes
        if (returnData.length != 64) {
            return (Status.CustomConditionInvalidResult, 0);
        }

        (bool success, bytes32 info) = abi.decode(returnData, (bool, bytes32));
        if (!success) {
            return (Status.CustomConditionViolation, info);
        }

        return (Status.Ok, info);
    }
}
