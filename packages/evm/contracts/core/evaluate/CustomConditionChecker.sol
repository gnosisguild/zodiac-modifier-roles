// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/ICustomCondition.sol";
import "../../types/Types.sol";
import "../../common/AbiLocation.sol";
import "./WithinAllowanceChecker.sol";

/**
 * @title CustomConditionChecker
 * @notice Validates transactions against external custom condition adapters.
 *
 * @dev Safely invokes ICustomCondition.check via staticcall. The adapter
 *      returns `(bool success, AllowanceConsumption[] consumptions)`: a pass/
 *      fail verdict plus zero or more directives to consume from allowances.
 *      Consumption is applied here through the shared WithinAllowanceChecker
 *      core (which enforces the balance cap) and settled post-execution like
 *      any other consumption — the adapter itself stays view/staticcall and
 *      never touches state.
 *
 *      A 32-byte return is accepted as a legacy bool-only verdict (no
 *      consumptions), so existing adapters keep working.
 *
 *   | Scenario              | staticcall Result     | Behavior                      | Status                          |
 *   |-----------------------|-----------------------|-------------------------------|---------------------------------|
 *   | No code at address    | (true, "")            | extcodesize == 0              | CustomConditionNotAContract     |
 *   | Function reverts      | (false, <error data>) | staticcall fails              | CustomConditionReverted         |
 *   | Returns wrong type    | (true, <bad shape>)   | decode reverts / len < 32     | CustomConditionInvalidResult    |
 *   | Returns false         | (true, <verdict>)     | Adapter rejects the condition | CustomConditionViolation        |
 *   | Consumption exceeds   | (true, <directive>)   | consumed > balance            | AllowanceExceeded               |
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
     * @param consumptions Running copy-on-write consumption list
     * @param pluckedValues Array of previously plucked values
     * @return status Ok if condition passes, error status otherwise
     * @return consumptions Updated consumption list (directives applied)
     */
    function check(
        bytes memory compValue,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 location,
        Condition memory condition,
        Consumption[] memory consumptions,
        bytes32[] memory pluckedValues
    ) internal view returns (Status status, Consumption[] memory) {
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
                consumptions,
                pluckedValues
            );
    }

    /**
     * @dev Safely invokes the adapter via staticcall, then applies any returned
     *      consumption directives through the shared allowance core.
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
        Consumption[] memory consumptions,
        bytes32[] memory pluckedValues
    ) private view returns (Status, Consumption[] memory) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(adapter)
        }
        if (codeSize == 0) {
            return (Status.CustomConditionNotAContract, consumptions);
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
            return (Status.CustomConditionReverted, consumptions);
        }

        // A 32-byte return is a legacy bool-only verdict (no consumptions).
        // Anything shorter is malformed. Otherwise decode the full result;
        // abi.decode reverts (fail-closed) on a malformed dynamic payload.
        bool success;
        AllowanceConsumption[] memory directives;
        if (returnData.length == 32) {
            success = abi.decode(returnData, (bool));
        } else if (returnData.length < 32) {
            return (Status.CustomConditionInvalidResult, consumptions);
        } else {
            (success, directives) = abi.decode(
                returnData,
                (bool, AllowanceConsumption[])
            );
        }

        if (!success) {
            return (Status.CustomConditionViolation, consumptions);
        }

        // Apply consumption directives. The shared core enforces the balance
        // cap; directives are settled post-execution like any consumption.
        for (uint256 i; i < directives.length; ++i) {
            Status status;
            (status, consumptions) = WithinAllowanceChecker.consume(
                consumptions,
                directives[i].allowanceKey,
                directives[i].amount
            );
            if (status != Status.Ok) {
                return (status, consumptions);
            }
        }

        return (Status.Ok, consumptions);
    }
}
