// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "./evaluate/ConditionEvaluator.sol";
import "./serialize/ConditionLoader.sol";
import "./Storage.sol";

import "../periphery/interfaces/ITransactionUnwrapper.sol";

/**
 * @title   Authorization
 *
 * @notice Authorizes transactions by evaluating role permissions and condition
 *         trees.
 *
 * @dev    The authorization follows three steps:
 *         1. Scope Resolution: Resolves the permission configuration
 *         2. Mode Validation: Checks for value transfer and tx operation
 *         3. Payload Validation: Evaluates condition trees against tx data
 *
 *         Transaction bundles are supported via adapter-based unwrapping.
 *
 * @author  gnosisguild
 */
abstract contract Authorization is RolesStorage {
    function _authorize(
        bytes32 roleKey,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) internal view returns (Consumption[] memory consumptions) {
        address adapter = unwrappers[_key(to, bytes4(data))];
        if (adapter == address(0)) {
            return
                _transaction(
                    roleKey,
                    data,
                    consumptions,
                    Transaction(to, value, operation)
                );
        }

        /*
         * Transaction Bundle
         */
        try
            ITransactionUnwrapper(adapter).unwrap(to, value, data, operation)
        returns (UnwrappedTransaction[] memory unwrapped) {
            for (uint256 i; i < unwrapped.length; ++i) {
                UnwrappedTransaction memory entry = unwrapped[i];
                consumptions = _transaction(
                    roleKey,
                    data[entry.dataLocation:entry.dataLocation +
                        entry.dataSize],
                    consumptions,
                    Transaction(entry.to, entry.value, entry.operation)
                );
            }
        } catch {
            revert MalformedMultiEntrypoint();
        }
    }

    /// @dev Inspects a transaction and authorizes based on role permissions.
    function _transaction(
        bytes32 roleKey,
        bytes calldata data,
        Consumption[] memory consumptions,
        Transaction memory transaction
    ) private view returns (Consumption[] memory) {
        Role storage role = roles[roleKey];

        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        Clearance clearance = role.clearance[transaction.to];

        /*
         * Resolve scopeConfig:
         * 1- look up target-specific entry
         * 2- fallback on global entry
         */

        // Target entry
        uint256 scopeConfig;
        if (clearance != Clearance.None) {
            bytes32 key = bytes32(bytes20(transaction.to)) |
                /*
                 * Clearance.Target:   set lower 12 bytes to 0xFF..FF
                 * Clearance.Function: set lower 12 bytes to selector
                 */
                (
                    clearance == Clearance.Target
                        ? (~bytes32(0) >> 160)
                        : (bytes32(bytes4(data)) >> 160)
                );

            scopeConfig = role.scopeConfig[key];
        }

        // Global entry
        if (scopeConfig == 0 && data.length != 0) {
            scopeConfig = role.scopeConfig[bytes32(bytes4(data)) >> 160];
        }

        if (scopeConfig == 0) {
            revert TransactionNotAllowed(transaction.to, bytes4(data));
        }

        /*
         * Check ExecutionOptions
         */
        {
            uint256 options = scopeConfig >> 160;
            if (options & 1 == 0 && transaction.value > 0) {
                revert SendNotAllowed(transaction.to);
            }
            if (
                options & 2 == 0 &&
                transaction.operation == Operation.DelegateCall
            ) {
                revert DelegateCallNotAllowed(transaction.to);
            }
        }

        /*
         * Load and Evaluate Condition
         */
        (Condition memory condition, uint256 maxPluckCount) = ConditionLoader
            .load(scopeConfig);

        Result memory result = ConditionEvaluator.evaluate(
            data,
            0,
            condition,
            consumptions,
            Context(
                transaction.to,
                transaction.value,
                transaction.operation,
                new bytes32[](maxPluckCount),
                new uint256[](maxPluckCount)
            )
        );

        if (result.status != Status.Ok) {
            revert ConditionViolation(
                result.status,
                result.violatedNodeIndex,
                result.payloadLocation
            );
        }

        return result.consumptions;
    }
}
