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
 * @title Authorization - a component of Zodiac Roles Mod responsible
 * for authorizing actions performed on behalf of a role.
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
    ) internal moduleOnly returns (Consumption[] memory) {
        // We never authorize the zero role, as it could clash with the
        // unassigned default role
        if (roleKey == 0) {
            revert NoMembership();
        }

        Role storage role = roles[roleKey];
        if (!role.members[sentOrSignedByModule()]) {
            revert NoMembership();
        }

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

    /// @dev Inspects an individual transaction and performs checks based on permission scoping.
    /// Wildcarded indicates whether params need to be inspected or not. When true, only ExecutionOptions are checked.
    /// @param role Role to check for.
    /// @param to Destination address of transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
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

        if (role.targets[to].clearance == Clearance.Function) {
            bytes32 header = role.scopeConfig[_key(to, bytes4(data))];
            {
                if (header == 0) {
                    return
                        Result({
                            status: Status.FunctionNotAllowed,
                            consumptions: consumptions,
                            info: bytes32(bytes4(data))
                        });
                }

                (bool isWildcarded, ExecutionOptions options, ) = ScopeConfig
                    .unpack(header);

                Status status = _executionOptions(value, operation, options);
                if (status != Status.Ok) {
                    return
                        Result({
                            status: status,
                            consumptions: consumptions,
                            info: 0
                        });
                }

                if (isWildcarded) {
                    return
                        Result({
                            status: Status.Ok,
                            consumptions: consumptions,
                            info: 0
                        });
                }
            }

            ContextCall memory callParams = ContextCall({
                to: to,
                value: value,
                operation: operation
            });

            return
                _scopedFunction(
                    header,
                    data,
                    Context({call: callParams, consumptions: consumptions})
                );
        } else if (role.targets[to].clearance == Clearance.Target) {
            return
                Result({
                    status: _executionOptions(
                        value,
                        operation,
                        role.targets[to].options
                    ),
                    consumptions: consumptions,
                    info: 0
                });
        } else {
            return
                Result({
                    status: Status.TargetAddressNotAllowed,
                    consumptions: consumptions,
                    info: 0
                });
        }
    }

    /// @dev Validates that the execution mode (value transfer and/or
    ///      delegatecall) is permitted by the current configuration
    function _executionOptions(
        uint256 value,
        Operation operation,
        ExecutionOptions options
    ) private pure returns (Status) {
        // isSend && !canSend
        if (
            value > 0 &&
            options != ExecutionOptions.Send &&
            options != ExecutionOptions.Both
        ) {
            return Status.SendNotAllowed;
        }

        // isDelegateCall && !canDelegateCall
        if (
            operation == Operation.DelegateCall &&
            options != ExecutionOptions.DelegateCall &&
            options != ExecutionOptions.Both
        ) {
            return Status.DelegateCallNotAllowed;
        }

        return Status.Ok;
    }

    function _scopedFunction(
        bytes32 scopeConfig,
        bytes calldata data,
        Context memory context
    ) private view returns (Result memory) {
        (, , address pointer) = ScopeConfig.unpack(scopeConfig);

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
}
