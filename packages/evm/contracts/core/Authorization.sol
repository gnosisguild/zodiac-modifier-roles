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
        Result memory result;
        Context memory context = Context(to, value, operation);

        address adapter = unwrappers[_key(to, bytes4(data))];
        if (adapter == address(0)) {
            result = _transaction(roleKey, data, result.consumptions, context);
        } else {
            result = _transactionBundle(adapter, roleKey, data, context);
        }
        if (result.status != Status.Ok) {
            revert ConditionViolation(result.status, result.info);
        }

        return result.consumptions;
    }

    function _transactionBundle(
        address adapter,
        bytes32 roleKey,
        bytes calldata data,
        Context memory context
    ) private view returns (Result memory result) {
        try
            ITransactionUnwrapper(adapter).unwrap(
                context.to,
                context.value,
                data,
                context.operation
            )
        returns (UnwrappedTransaction[] memory transactions) {
            for (uint256 i; i < transactions.length; ) {
                UnwrappedTransaction memory transaction = transactions[i];
                uint256 left = transaction.dataLocation;
                uint256 right = left + transaction.dataSize;
                result = _transaction(
                    roleKey,
                    data[left:right],
                    result.consumptions,
                    Context(
                        transaction.to,
                        transaction.value,
                        transaction.operation
                    )
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
        bytes32 roleKey,
        bytes calldata data,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory) {
        Role storage role = roles[roleKey];

        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        Clearance clearance = role.clearance[context.to];
        if (clearance == Clearance.None) {
            return Result(Status.TargetAddressNotAllowed, consumptions, 0);
        }

        bytes32 key = clearance == Clearance.Target
            ? bytes32(bytes20(context.to)) | (~bytes32(0) >> 160)
            : bytes32(bytes20(context.to)) | (bytes32(bytes4(data)) >> 160);

        bytes32 scopeConfig = role.scopeConfig[key];
        if (scopeConfig == 0) {
            return
                Result(
                    clearance == Clearance.Target
                        ? Status.TargetAddressNotAllowed
                        : Status.FunctionNotAllowed,
                    consumptions,
                    bytes4(data)
                );
        }

        return _function(scopeConfig, data, consumptions, context);
    }

    /// @dev Checks function permission and evaluates conditions if present.
    function _function(
        bytes32 scopeConfig,
        bytes calldata data,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory) {
        (
            bool isWildcarded,
            ExecutionOptions options,
            address pointer
        ) = ScopeConfig.unpack(scopeConfig);

        Status status = _executionOptions(
            context.value,
            context.operation,
            options
        );
        if (status != Status.Ok) {
            return Result(status, consumptions, 0);
        }

        if (isWildcarded) {
            return Result(Status.Ok, consumptions, 0);
        }

        (Condition memory condition, Layout memory layout) = ConditionUnpacker
            .unpack(ImmutableStorage.load(pointer));

        // Its possible that we have a fully nonStructural tree
        Payload memory payload;
        if (layout.encoding != Encoding.None) {
            payload = AbiDecoder.inspect(data, layout);
        }

        return
            ConditionLogic.evaluate(
                data,
                condition,
                payload,
                consumptions,
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
