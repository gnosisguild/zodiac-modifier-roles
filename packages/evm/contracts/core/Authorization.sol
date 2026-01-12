// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../common/ImmutableStorage.sol";
import "../periphery/interfaces/ITransactionUnwrapper.sol";

import "./evaluate/ConditionLogic.sol";
import "./serialize/ConditionUnpacker.sol";
import "./Storage.sol";

/**
 * @title Authorization
 * @notice Authorizes transactions against role permissions.
 *
 *         For each transaction, it evaluates:
 *         1. Target Clearance
 *         2. ExecutionOptions
 *         3. Condition rules
 *
 *         Handles unwrapping of transaction bundles if an adapter is registered.
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
         * Load Condition
         */
        (
            Condition memory condition,
            Payload memory payload,
            Context memory context
        ) = _unpackScopeConfig(scopeConfig, data, transaction);

        /*
         * Evaluate Condition
         */
        Result memory result = ConditionLogic.evaluate(
            data,
            condition,
            payload,
            consumptions,
            context
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

    /// @dev Loads packed scope config from immutable storage, unpacks condition
    ///      tree and layout, decodes calldata into payload, and builds context.
    function _unpackScopeConfig(
        uint256 scopeConfig,
        bytes calldata data,
        Transaction memory transaction
    )
        private
        view
        returns (Condition memory, Payload memory payload, Context memory)
    {
        address pointer = address(uint160(scopeConfig));
        bytes memory buffer = ImmutableStorage.load(pointer);

        (
            Condition memory condition,
            Layout memory layout,
            uint256 maxPluckIndex
        ) = ConditionUnpacker.unpack(buffer);

        if (layout.encoding != Encoding.None) {
            payload = AbiDecoder.inspect(data, layout);
        }

        return (
            condition,
            payload,
            Context(
                transaction.to,
                transaction.value,
                transaction.operation,
                new bytes32[](maxPluckIndex + 1)
            )
        );
    }
}
