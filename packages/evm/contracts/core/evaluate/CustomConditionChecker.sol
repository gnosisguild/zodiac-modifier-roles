// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/ICustomCondition.sol";
import "../../types/Types.sol";

/**
 * @title CustomConditionChecker
 * @notice Validates transactions against external custom condition adapters.
 *
 * @dev Safely invokes ICustomCondition.check via staticcall, handling all
 *      error scenarios:
 *
 *   | Scenario              | staticcall Result     | Behavior                      | Status                          |
 *   |-----------------------|-----------------------|-------------------------------|---------------------------------|
 *   | No code at address    | (true, "")            | extcodesize == 0              | CustomConditionNotAContract     |
 *   | Wrong interface       | (false, "")           | staticcall fails              | CustomConditionReverted         |
 *   | Function reverts      | (false, <error data>) | staticcall fails              | CustomConditionReverted         |
 *   | Returns wrong type    | (true, <len != 64>)   | returnData.length != 64       | CustomConditionInvalidResult    |
 *   | Returns (false, info) | (true, <64 bytes>)    | Adapter rejects the condition | CustomConditionViolation        |
 *
 * @author gnosisguild
 */
library CustomConditionChecker {
    /**
     * @notice Evaluates a custom condition against an external adapter.
     * @param compValue Packed config: adapter address (20 bytes) + optional extra data
     * @param to Target address of the transaction
     * @param value ETH value of the transaction
     * @param data Calldata of the transaction
     * @param operation Call or DelegateCall
     * @param location Byte offset into calldata
     * @param size Byte length of the parameter
     * @param pluckedValues Array of previously plucked values
     * @return status Ok if condition passes, error status otherwise
     * @return info Additional info returned by adapter (or error context)
     */
    function check(
        bytes memory compValue,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 location,
        uint256 size,
        bytes32[] memory pluckedValues
    ) internal view returns (Status status, bytes32 info) {
        address adapter = address(bytes20(compValue));

        bytes memory extra;
        if (compValue.length > 20) {
            assembly {
                let len := sub(mload(compValue), 20)
                extra := mload(0x40)
                mstore(0x40, add(extra, add(0x40, len)))
                mstore(extra, len)
                mcopy(add(extra, 0x20), add(compValue, 0x34), len)
            }
        }

        return
            _invoke(
                adapter,
                to,
                value,
                data,
                operation,
                location,
                size,
                extra,
                pluckedValues
            );
    }

    /**
     * @dev Safely invokes the adapter via staticcall.
     */
    function _invoke(
        address adapter,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 location,
        uint256 size,
        bytes memory extra,
        bytes32[] memory pluckedValues
    ) private view returns (Status, bytes32) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(adapter)
        }
        if (codeSize == 0) {
            return (Status.CustomConditionNotAContract, 0);
        }

        (bool callSuccess, bytes memory returnData) = adapter.staticcall(
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
}
