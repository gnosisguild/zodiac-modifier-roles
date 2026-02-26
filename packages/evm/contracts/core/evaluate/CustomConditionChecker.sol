// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/ICustomCondition.sol";
import "../../types/Types.sol";
import "../../common/AbiLocation.sol";

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
 *   | Returns wrong type    | (true, <len != 32>)   | returnData.length != 32       | CustomConditionInvalidResult    |
 *   | Returns false         | (true, <32 bytes>)    | Adapter rejects the condition | CustomConditionViolation        |
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
     * @param condition The condition with payload info for size computation
     * @param pluckedValues Array of previously plucked values
     * @return status Ok if condition passes, error status otherwise
     */
    function check(
        bytes memory compValue,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 location,
        Condition memory condition,
        bytes32[] memory pluckedValues
    ) internal view returns (Status status) {
        address adapter = address(bytes20(compValue));

        uint256 size = condition.size != 0
            ? condition.size
            : AbiLocation.size(data, location, condition);

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
    ) private view returns (Status) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(adapter)
        }
        if (codeSize == 0) {
            return Status.CustomConditionNotAContract;
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
            return Status.CustomConditionReverted;
        }

        if (returnData.length != 32) {
            return Status.CustomConditionInvalidResult;
        }

        bool success = abi.decode(returnData, (bool));
        if (!success) {
            return Status.CustomConditionViolation;
        }

        return Status.Ok;
    }
}
