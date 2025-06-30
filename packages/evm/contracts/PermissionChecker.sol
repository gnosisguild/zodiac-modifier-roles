// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./_Core.sol";
import "./_Periphery.sol";
import "./AbiDecoder.sol";
import "./Consumptions.sol";
import "./Topology.sol";

import "./packers/BufferPacker.sol";

/**
 * @title PermissionChecker - a component of Zodiac Roles Mod responsible
 * for enforcing and authorizing actions performed on behalf of a role.
 *
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */
abstract contract PermissionChecker is Core, Periphery {
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

        ITransactionUnwrapper adapter = getTransactionUnwrapper(
            to,
            bytes4(data)
        );

        Status status;
        Result memory result;
        if (address(adapter) == address(0)) {
            (status, result) = _transaction(
                role,
                to,
                value,
                data,
                operation,
                result.consumptions
            );
        } else {
            (status, result) = _multiEntrypoint(
                ITransactionUnwrapper(adapter),
                role,
                to,
                value,
                data,
                operation
            );
        }
        if (status != Status.Ok) {
            revert ConditionViolation(status, result.info);
        }

        return result.consumptions;
    }

    function _multiEntrypoint(
        ITransactionUnwrapper adapter,
        Role storage role,
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) private view returns (Status status, Result memory result) {
        try adapter.unwrap(to, value, data, operation) returns (
            UnwrappedTransaction[] memory transactions
        ) {
            for (uint256 i; i < transactions.length; ) {
                UnwrappedTransaction memory transaction = transactions[i];
                uint256 left = transaction.dataLocation;
                uint256 right = left + transaction.dataSize;
                (status, result) = _transaction(
                    role,
                    transaction.to,
                    transaction.value,
                    data[left:right],
                    transaction.operation,
                    result.consumptions
                );
                if (status != Status.Ok) {
                    return (status, result);
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
    ) private view returns (Status, Result memory) {
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        if (role.targets[to].clearance == Clearance.Function) {
            bytes32 key = _key(to, bytes4(data));
            {
                bytes32 header = role.scopeConfig[key];
                if (header == 0) {
                    return (
                        Status.FunctionNotAllowed,
                        Result({
                            consumptions: consumptions,
                            info: bytes32(bytes4(data))
                        })
                    );
                }

                (bool isWildcarded, ExecutionOptions options) = BufferPacker
                    .unpackOptions(header);

                Status status = _executionOptions(value, operation, options);
                if (status != Status.Ok) {
                    return (
                        status,
                        Result({consumptions: consumptions, info: 0})
                    );
                }

                if (isWildcarded) {
                    return (
                        Status.Ok,
                        Result({consumptions: consumptions, info: 0})
                    );
                }
            }

            return
                _scopedFunction(
                    role,
                    key,
                    data,
                    Context({
                        to: to,
                        value: value,
                        operation: operation,
                        consumptions: consumptions
                    })
                );
        } else if (role.targets[to].clearance == Clearance.Target) {
            return (
                _executionOptions(value, operation, role.targets[to].options),
                Result({consumptions: consumptions, info: 0})
            );
        } else {
            return (
                Status.TargetAddressNotAllowed,
                Result({consumptions: consumptions, info: 0})
            );
        }
    }

    /// @dev Examines the ether value and operation for a given role target.
    /// @param value Ether value of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    /// @param options Determines if a transaction can send ether and/or delegatecall to target.
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
        Role storage role,
        bytes32 key,
        bytes calldata data,
        Context memory context
    ) private view returns (Status, Result memory) {
        (
            Condition memory condition,
            AbiTypeTree[] memory typeTree,
            Consumption[] memory consumptions
        ) = _load(role, key);

        Payload memory payload = AbiDecoder.inspect(data, typeTree, 0);

        context.consumptions = context.consumptions.length > 0
            ? Consumptions.merge(context.consumptions, consumptions)
            : consumptions;

        return _walk(data, condition, payload, context);
    }

    function _walk(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status, Result memory) {
        Operator operator = condition.operator;

        if (operator < Operator.EqualTo) {
            if (operator == Operator.Pass) {
                return (
                    Status.Ok,
                    Result({consumptions: context.consumptions, info: 0})
                );
            } else if (operator == Operator.Matches) {
                return _matches(data, condition, payload, context);
            } else if (operator == Operator.And) {
                return _and(data, condition, payload, context);
            } else if (operator == Operator.Or) {
                return _or(data, condition, payload, context);
            } else if (operator == Operator.Nor) {
                return _nor(data, condition, payload, context);
            } else if (operator == Operator.ArraySome) {
                return _arraySome(data, condition, payload, context);
            } else if (operator == Operator.ArrayEvery) {
                return _arrayEvery(data, condition, payload, context);
            } else {
                assert(operator == Operator.ArraySubset);
                return _arraySubset(data, condition, payload, context);
            }
        } else {
            if (operator <= Operator.LessThan) {
                return (
                    _compare(data, condition, payload),
                    Result({consumptions: context.consumptions, info: 0})
                );
            } else if (operator <= Operator.SignedIntLessThan) {
                return (
                    _compareSignedInt(data, condition, payload),
                    Result({consumptions: context.consumptions, info: 0})
                );
            } else if (operator == Operator.Bitmask) {
                return (
                    _bitmask(data, condition, payload),
                    Result({consumptions: context.consumptions, info: 0})
                );
            } else if (operator == Operator.Custom) {
                return _custom(data, condition, payload, context);
            } else if (operator == Operator.WithinAllowance) {
                return _withinAllowance(data, condition, payload, context);
            } else if (operator == Operator.EtherWithinAllowance) {
                return _etherWithinAllowance(condition, context);
            } else {
                assert(operator == Operator.CallWithinAllowance);
                return _callWithinAllowance(condition, context);
            }
        }
    }

    function _matches(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status status, Result memory result) {
        result.consumptions = context.consumptions;

        if (condition.children.length != payload.children.length) {
            return (Status.ParameterNotAMatch, result);
        }

        for (uint256 i; i < condition.children.length; ) {
            (status, result) = _walk(
                data,
                condition.children[i],
                payload.children[i],
                Context({
                    to: context.to,
                    value: context.value,
                    operation: context.operation,
                    consumptions: result.consumptions
                })
            );
            if (status != Status.Ok) {
                return (
                    status,
                    Result({
                        consumptions: context.consumptions,
                        info: result.info
                    })
                );
            }
            unchecked {
                ++i;
            }
        }

        return (Status.Ok, result);
    }

    function _and(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status status, Result memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < condition.children.length; ) {
            (status, result) = _walk(
                data,
                condition.children[i],
                payload,
                Context({
                    to: context.to,
                    value: context.value,
                    operation: context.operation,
                    consumptions: result.consumptions
                })
            );
            if (status != Status.Ok) {
                return (
                    status,
                    Result({
                        consumptions: context.consumptions,
                        info: result.info
                    })
                );
            }
            unchecked {
                ++i;
            }
        }
        return (Status.Ok, result);
    }

    function _or(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status status, Result memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < condition.children.length; ) {
            (status, result) = _walk(
                data,
                condition.children[i],
                payload,
                Context({
                    to: context.to,
                    value: context.value,
                    operation: context.operation,
                    consumptions: result.consumptions
                })
            );
            if (status == Status.Ok) {
                return (status, result);
            }
            unchecked {
                ++i;
            }
        }

        return (
            Status.OrViolation,
            Result({consumptions: context.consumptions, info: 0})
        );
    }

    function _nor(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status status, Result memory) {
        for (uint256 i; i < condition.children.length; ) {
            (status, ) = _walk(data, condition.children[i], payload, context);
            if (status == Status.Ok) {
                return (
                    Status.NorViolation,
                    Result({consumptions: context.consumptions, info: 0})
                );
            }
            unchecked {
                ++i;
            }
        }
        return (
            Status.Ok,
            Result({consumptions: context.consumptions, info: 0})
        );
    }

    function _arraySome(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status status, Result memory result) {
        result.consumptions = context.consumptions;

        uint256 length = condition.children.length;
        for (uint256 i; i < length; ) {
            (status, result) = _walk(
                data,
                condition.children[0],
                payload.children[i],
                Context({
                    to: context.to,
                    value: context.value,
                    operation: context.operation,
                    consumptions: result.consumptions
                })
            );
            if (status == Status.Ok) {
                return (status, result);
            }
            unchecked {
                ++i;
            }
        }
        return (
            Status.NoArrayElementPasses,
            Result({consumptions: context.consumptions, info: 0})
        );
    }

    function _arrayEvery(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status status, Result memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < payload.children.length; ) {
            (status, result) = _walk(
                data,
                condition.children[0],
                payload.children[i],
                Context({
                    to: context.to,
                    value: context.value,
                    operation: context.operation,
                    consumptions: result.consumptions
                })
            );
            if (status != Status.Ok) {
                return (
                    Status.NotEveryArrayElementPasses,
                    Result({consumptions: context.consumptions, info: 0})
                );
            }
            unchecked {
                ++i;
            }
        }
        return (Status.Ok, result);
    }

    function _arraySubset(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status, Result memory result) {
        result.consumptions = context.consumptions;

        if (
            payload.children.length == 0 ||
            payload.children.length > condition.children.length
        ) {
            return (Status.ParameterNotSubsetOfAllowed, result);
        }

        uint256 taken;
        for (uint256 i; i < payload.children.length; ++i) {
            bool found = false;
            for (uint256 j; j < condition.children.length; ++j) {
                if (taken & (1 << j) != 0) continue;

                (Status status, Result memory _result) = _walk(
                    data,
                    condition.children[j],
                    payload.children[i],
                    Context({
                        to: context.to,
                        value: context.value,
                        operation: context.operation,
                        consumptions: result.consumptions
                    })
                );
                if (status == Status.Ok) {
                    found = true;
                    taken |= 1 << j;
                    result = _result;
                    break;
                }
            }
            if (!found) {
                return (
                    Status.ParameterNotSubsetOfAllowed,
                    Result({consumptions: context.consumptions, info: 0})
                );
            }
        }

        return (Status.Ok, result);
    }

    function _compare(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload
    ) private pure returns (Status) {
        Operator operator = condition.operator;
        bytes32 compValue = condition.compValue;
        bytes32 value = operator == Operator.EqualTo
            ? keccak256(AbiDecoder.pluck(data, payload.location, payload.size))
            : AbiDecoder.word(data, payload.location);

        if (operator == Operator.EqualTo && value != compValue) {
            return Status.ParameterNotAllowed;
        } else if (operator == Operator.GreaterThan && value <= compValue) {
            return Status.ParameterLessThanAllowed;
        } else if (operator == Operator.LessThan && value >= compValue) {
            return Status.ParameterGreaterThanAllowed;
        } else {
            return Status.Ok;
        }
    }

    function _compareSignedInt(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload
    ) private pure returns (Status) {
        Operator operator = condition.operator;
        int256 compValue = int256(uint256(condition.compValue));
        int256 value = int256(uint256(AbiDecoder.word(data, payload.location)));

        if (operator == Operator.SignedIntGreaterThan && value <= compValue) {
            return Status.ParameterLessThanAllowed;
        } else if (
            operator == Operator.SignedIntLessThan && value >= compValue
        ) {
            return Status.ParameterGreaterThanAllowed;
        } else {
            return Status.Ok;
        }
    }

    /**
     * Applies a shift and bitmask on the payload bytes and compares the
     * result to the expected value. The shift offset, bitmask, and expected
     * value are specified in the compValue parameter, which is tightly
     * packed as follows:
     * <2 bytes shift offset><15 bytes bitmask><15 bytes expected value>
     */
    function _bitmask(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload
    ) private pure returns (Status) {
        bytes32 compValue = condition.compValue;
        bool isInline = condition.paramType == AbiType.Static;
        bytes calldata value = AbiDecoder.pluck(
            data,
            payload.location + (isInline ? 0 : 32),
            payload.size - (isInline ? 0 : 32)
        );

        uint256 shift = uint16(bytes2(compValue));
        if (shift >= value.length) {
            return Status.BitmaskOverflow;
        }

        bytes32 rinse = bytes15(0xffffffffffffffffffffffffffffff);
        bytes32 mask = (compValue << 16) & rinse;
        // while its necessary to apply the rinse to the mask its not strictly
        // necessary to do so for the expected value, since we get remaining
        // 15 bytes anyway (shifting the word by 17 bytes)
        bytes32 expected = (compValue << (16 + 15 * 8)) & rinse;
        bytes32 slice = bytes32(value[shift:]);

        return
            (slice & mask) == expected ? Status.Ok : Status.BitmaskNotAllowed;
    }

    function _custom(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Status, Result memory) {
        // 20 bytes on the left
        ICustomCondition adapter = ICustomCondition(
            address(bytes20(condition.compValue))
        );
        // 12 bytes on the right
        bytes12 extra = bytes12(uint96(uint256(condition.compValue)));

        (bool success, bytes32 info) = adapter.check(
            context.to,
            context.value,
            data,
            context.operation,
            payload.location,
            payload.size,
            extra
        );
        return (
            success ? Status.Ok : Status.CustomConditionViolation,
            Result({consumptions: context.consumptions, info: info})
        );
    }

    function _withinAllowance(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private pure returns (Status, Result memory) {
        uint256 value = uint256(AbiDecoder.word(data, payload.location));
        return __consume(value, condition, context.consumptions);
    }

    function _etherWithinAllowance(
        Condition memory condition,
        Context memory context
    ) private pure returns (Status status, Result memory result) {
        (status, result) = __consume(
            context.value,
            condition,
            context.consumptions
        );
        return (
            status == Status.Ok ? Status.Ok : Status.EtherAllowanceExceeded,
            result
        );
    }

    function _callWithinAllowance(
        Condition memory condition,
        Context memory context
    ) private pure returns (Status status, Result memory result) {
        (status, result) = __consume(1, condition, context.consumptions);
        return (
            status == Status.Ok ? Status.Ok : Status.CallAllowanceExceeded,
            result
        );
    }

    function __consume(
        uint256 value,
        Condition memory condition,
        Consumption[] memory consumptions
    ) private pure returns (Status, Result memory) {
        (uint256 index, bool found) = Consumptions.find(
            consumptions,
            condition.compValue
        );
        assert(found);

        if (
            value + consumptions[index].consumed > consumptions[index].balance
        ) {
            return (
                Status.AllowanceExceeded,
                Result({
                    consumptions: consumptions,
                    info: consumptions[index].allowanceKey
                })
            );
        } else {
            consumptions = Consumptions.clone(consumptions);
            consumptions[index].consumed += uint128(value);
            return (Status.Ok, Result({consumptions: consumptions, info: 0}));
        }
    }

    struct Context {
        address to;
        uint256 value;
        Consumption[] consumptions;
        Operation operation;
    }

    struct Result {
        Consumption[] consumptions;
        bytes32 info;
    }

    enum Status {
        Ok,
        /// Role not allowed to delegate call to target address
        DelegateCallNotAllowed,
        /// Role not allowed to call target address
        TargetAddressNotAllowed,
        /// Role not allowed to call this function on target address
        FunctionNotAllowed,
        /// Role not allowed to send to target address
        SendNotAllowed,
        /// Or conition not met
        OrViolation,
        /// Nor conition not met
        NorViolation,
        /// Parameter value is not equal to allowed
        ParameterNotAllowed,
        /// Parameter value less than allowed
        ParameterLessThanAllowed,
        /// Parameter value greater than maximum allowed by role
        ParameterGreaterThanAllowed,
        /// Parameter value does not match
        ParameterNotAMatch,
        /// Array elements do not meet allowed criteria for every element
        NotEveryArrayElementPasses,
        /// Array elements do not meet allowed criteria for at least one element
        NoArrayElementPasses,
        /// Parameter value not a subset of allowed
        ParameterNotSubsetOfAllowed,
        /// Bitmask exceeded value length
        BitmaskOverflow,
        /// Bitmask not an allowed value
        BitmaskNotAllowed,
        CustomConditionViolation,
        AllowanceExceeded,
        CallAllowanceExceeded,
        EtherAllowanceExceeded
    }

    /// Sender is not a member of the role
    error NoMembership();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Calldata unwrapping failed
    error MalformedMultiEntrypoint();

    error ConditionViolation(Status status, bytes32 info);
}
