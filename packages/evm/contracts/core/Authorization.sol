// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../common/AbiDecoder.sol";
import "../common/ImmutableStorage.sol";
import "../common/ScopeConfig.sol";
import "../periphery/interfaces/ITransactionUnwrapper.sol";

import "./Storage.sol";
import "./evaluate/ConditionLogic.sol";
import "./serialize/ConditionUnpacker.sol";

import "../types/Types.sol";

/**
 * @title Authorization - Authorizes transactions based on target clearance
 *        and function scope rules.
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
    ) internal view returns (Consumption[] memory) {
        Role storage role = roles[roleKey];

        Result memory result;
        address adapter = unwrappers[_key(to, bytes4(data))];
        if (adapter == address(0)) {
            result = _transaction(
                role,
                to,
                value,
                data,
                operation,
                result.consumptions
            );
        } else {
            result = _transactionBundle(
                ITransactionUnwrapper(adapter),
                role,
                to,
                value,
                data,
                operation
            );
        }
        if (result.status != Status.Ok) {
            revert ConditionViolation(result.status, result.info);
        }

        return result.consumptions;
    }

    function _transactionBundle(
        ITransactionUnwrapper adapter,
        Role storage role,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) private view returns (Result memory result) {
        try adapter.unwrap(to, value, data, operation) returns (
            UnwrappedTransaction[] memory transactions
        ) {
            for (uint256 i; i < transactions.length; ) {
                UnwrappedTransaction memory transaction = transactions[i];
                uint256 left = transaction.dataLocation;
                uint256 right = left + transaction.dataSize;
                result = _transaction(
                    role,
                    transaction.to,
                    transaction.value,
                    data[left:right],
                    transaction.operation,
                    result.consumptions
                );
                if (result.status != Status.Ok) {
                    return result;
                }
                unchecked {
                    ++i;
                }
            }
        } catch {
            revert MalformedMultiEntrypoint();
        }
    }

    /// @dev Inspects a transaction and authorizes based on role permissions.
    function _transaction(
        Role storage role,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        Consumption[] memory consumptions
    ) private view returns (Result memory) {
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        Clearance clearance = role.clearance[to];
        if (clearance == Clearance.None) {
            return Result(Status.TargetAddressNotAllowed, consumptions, 0);
        }

        bytes32 key = clearance == Clearance.Target
            ? bytes32(bytes20(to)) | (~bytes32(0) >> 160)
            : bytes32(bytes20(to)) | (bytes32(bytes4(data)) >> 160);

        bytes32 scopeConfig = role.scopeConfig[key];
        if (scopeConfig == 0) {
            return
                Result(
                    clearance == Clearance.Target
                        ? Status.TargetAddressNotAllowed
                        : Status.FunctionNotAllowed,
                    consumptions,
                    clearance == Clearance.Target
                        ? bytes32(0)
                        : bytes32(bytes4(data))
                );
        }

        Context memory context = Context(
            ContextCall(to, value, operation),
            consumptions
        );

        return _function(scopeConfig, data, context);
    }

    /// @dev Checks function permission and evaluates conditions if present.
    function _function(
        bytes32 scopeConfig,
        bytes calldata data,
        Context memory context
    ) private view returns (Result memory) {
        (
            bool isWildcarded,
            ExecutionOptions options,
            address pointer
        ) = ScopeConfig.unpack(scopeConfig);

        Status status = _executionOptions(
            context.call.value,
            context.call.operation,
            options
        );
        if (status != Status.Ok) {
            return Result(status, context.consumptions, 0);
        }

        if (isWildcarded) {
            return Result(Status.Ok, context.consumptions, 0);
        }

        bytes memory buffer = ImmutableStorage.load(pointer);
        (Condition memory condition, Layout memory layout) = ConditionUnpacker
            .unpack(buffer);

        return
            ConditionLogic.evaluate(
                data,
                condition,
                AbiDecoder.inspect(data, layout),
                context
            );
    }

    /// @dev Validates that the execution mode (value transfer and/or
    ///      delegatecall) is permitted by the current configuration.
    function _executionOptions(
        uint256 value,
        Operation operation,
        ExecutionOptions options
    ) private pure returns (Status) {
        if (
            value > 0 &&
            options != ExecutionOptions.Send &&
            options != ExecutionOptions.Both
        ) {
            return Status.SendNotAllowed;
        }

        if (
            operation == Operation.DelegateCall &&
            options != ExecutionOptions.DelegateCall &&
            options != ExecutionOptions.Both
        ) {
            return Status.DelegateCallNotAllowed;
        }

        return Status.Ok;
    }
}
