// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../common/ImmutableStorage.sol";
import "../common/ScopeConfig.sol";
import "../periphery/interfaces/ITransactionUnwrapper.sol";

import "./evaluate/ConditionLogic.sol";
import "./serialize/ConditionUnpacker.sol";
import "./Storage.sol";

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
        Transaction memory transaction = Transaction(to, value, operation);

        address adapter = unwrappers[_key(to, bytes4(data))];
        if (adapter == address(0)) {
            result = _transaction(
                roleKey,
                data,
                result.consumptions,
                transaction
            );
        } else {
            result = _transactionBundle(adapter, roleKey, data, transaction);
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
        Transaction memory transaction
    ) private view returns (Result memory result) {
        try
            ITransactionUnwrapper(adapter).unwrap(
                transaction.to,
                transaction.value,
                data,
                transaction.operation
            )
        returns (UnwrappedTransaction[] memory unwrapped) {
            for (uint256 i; i < unwrapped.length; ++i) {
                UnwrappedTransaction memory entry = unwrapped[i];
                uint256 left = entry.dataLocation;
                uint256 right = left + entry.dataSize;
                result = _transaction(
                    roleKey,
                    data[left:right],
                    result.consumptions,
                    Transaction(entry.to, entry.value, entry.operation)
                );
                if (result.status != Status.Ok) {
                    return result;
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
        Transaction memory transaction
    ) private view returns (Result memory) {
        Role storage role = roles[roleKey];

        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        Clearance clearance = role.clearance[transaction.to];
        if (clearance == Clearance.None) {
            return Result(Status.TargetAddressNotAllowed, consumptions, 0);
        }

        bytes32 key = bytes32(bytes20(transaction.to)) |
            (
                clearance == Clearance.Target
                    ? (~bytes32(0) >> 160)
                    : (bytes32(bytes4(data)) >> 160)
            );

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

        return _function(scopeConfig, data, consumptions, transaction);
    }

    /// @dev Checks function permission and evaluates conditions.
    function _function(
        bytes32 scopeConfig,
        bytes calldata data,
        Consumption[] memory consumptions,
        Transaction memory transaction
    ) private view returns (Result memory result) {
        (ExecutionOptions options, address pointer) = ScopeConfig.unpack(
            scopeConfig
        );

        /*
         * ExecutionOptions can send:
         *  options == ExecutionOptions.Send ||
         *  options == ExecutionOptions.Both
         */
        if (uint8(options) & 1 == 0 && transaction.value > 0) {
            return Result(Status.SendNotAllowed, consumptions, 0);
        }

        /*
         * ExecutionOptions can delegateCall:
         * options == ExecutionOptions.DelegateCall ||
         * options == ExecutionOptions.Both
         */
        if (
            uint8(options) & 2 == 0 &&
            transaction.operation == Operation.DelegateCall
        ) {
            return Result(Status.DelegateCallNotAllowed, consumptions, 0);
        }

        (
            Condition memory condition,
            Layout memory layout,
            uint256 maxPluckIndex
        ) = ConditionUnpacker.unpack(ImmutableStorage.load(pointer));

        Payload memory payload;
        if (layout.encoding != Encoding.None) {
            payload = AbiDecoder.inspect(data, layout);
        }

        Context memory context = Context(
            transaction.to,
            transaction.value,
            transaction.operation,
            new bytes32[](maxPluckIndex + 1)
        );

        return
            ConditionLogic.evaluate(
                data,
                condition,
                payload,
                consumptions,
                context
            );
    }
}
