// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../common/AbiDecoder.sol";

import "./evaluate/ConditionLogic.sol";
import "./serialize/ConditionLoader.sol";
import "./Storage.sol";

import "../periphery/interfaces/ITransactionUnwrapper.sol";

/**
 * @title Authorization
 * @notice Authorizes transactions by evaluating role permissions:
 *         1. Target Clearance - is the target address allowed?
 *         2. ExecutionOptions - can it send value or delegatecall?
 *         3. Condition tree - do parameters satisfy the constraints?
 *
 * @dev Handles unwrapping of transaction bundles if an adapter is registered.
 *
 * @author gnosisguild
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
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        Role storage role = roles[roleKey];
        /*
         * Check Clearance
         */
        Clearance clearance = role.clearance[transaction.to];
        if (clearance == Clearance.None) {
            revert TargetAddressNotAllowed(transaction.to);
        }

        /*
         * Check that some Condition is defined
         */
        uint256 scopeConfig;
        {
            bytes32 key = bytes32(bytes20(transaction.to)) |
                (
                    clearance == Clearance.Target
                        ? (~bytes32(0) >> 160)
                        : (bytes32(bytes4(data)) >> 160)
                );

            scopeConfig = role.scopeConfig[key];
            if (scopeConfig == 0) {
                revert FunctionNotAllowed(transaction.to, bytes4(data));
            }
        }

        /*
         * Check ExecutionOptions
         */
        uint256 options = scopeConfig >> 160;
        if (options & 1 == 0 && transaction.value > 0) {
            revert SendNotAllowed(transaction.to);
        }
        if (
            options & 2 == 0 && transaction.operation == Operation.DelegateCall
        ) {
            revert DelegateCallNotAllowed(transaction.to);
        }

        /*
         * Load and Evaluate Condition
         */
        return _evaluate(scopeConfig, data, consumptions, transaction);
    }

    /// @dev Loads condition and evaluates against calldata.
    function _evaluate(
        uint256 scopeConfig,
        bytes calldata data,
        Consumption[] memory consumptions,
        Transaction memory transaction
    ) private view returns (Consumption[] memory) {
        (
            Condition memory condition,
            Layout memory layout,
            uint256 maxPluckIndex
        ) = ConditionLoader.load(scopeConfig);

        Payload memory payload;
        if (layout.encoding != Encoding.None) {
            payload = AbiDecoder.inspect(data, layout);
        }

        Result memory result = ConditionLogic.evaluate(
            data,
            condition,
            payload,
            consumptions,
            Context(
                transaction.to,
                transaction.value,
                transaction.operation,
                new bytes32[](maxPluckIndex + 1),
                new Payload[](maxPluckIndex + 1)
            )
        );

        if (result.status != Status.Ok) {
            revert ConditionViolation(
                result.status,
                result.violatedNodeIndex,
                result.payloadLocation,
                result.payloadSize
            );
        }

        return result.consumptions;
    }
}
