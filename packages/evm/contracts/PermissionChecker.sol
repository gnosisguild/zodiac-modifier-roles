// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

import "./Core.sol";
import "./Periphery.sol";
import "./Decoder.sol";
import "./ScopeConfig.sol";

/**
 * @title PermissionChecker - a component of the Zodiac Roles Mod that is
 * responsible for enforcing and authorizing actions performed on behalf of a
 * role.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.pm>
 */
abstract contract PermissionChecker is Core, Periphery {
    function authorize(
        Role storage role,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) internal view returns (Trace[] memory result) {
        if (!role.members[msg.sender]) {
            revert NoMembership();
        }

        ITransactionUnwrapper adapter = getTransactionUnwrapper(
            to,
            bytes4(data)
        );
        if (address(adapter) == address(0)) {
            return _singleEntrypoint(role, to, value, data, operation);
        } else {
            return
                _multiEntrypoint(
                    ITransactionUnwrapper(adapter),
                    role,
                    to,
                    value,
                    data,
                    operation
                );
        }
    }

    function _singleEntrypoint(
        Role storage role,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) private view returns (Trace[] memory) {
        (Status status, Trace[] memory result) = _transaction(
            role,
            to,
            value,
            data,
            operation
        );
        if (status != Status.Ok) {
            revertWith(status);
        }
        return result;
    }

    function _multiEntrypoint(
        ITransactionUnwrapper adapter,
        Role storage role,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) private view returns (Trace[] memory result) {
        try adapter.unwrap(to, value, data, operation) returns (
            UnwrappedTransaction[] memory transactions
        ) {
            for (uint256 i; i < transactions.length; ) {
                (Status status, Trace[] memory more) = _transaction(
                    role,
                    data,
                    transactions[i]
                );
                if (status != Status.Ok) {
                    revertWith(status);
                }
                result = _trace(result, more);
                unchecked {
                    ++i;
                }
            }
        } catch {
            revert MalformedMultiEntrypoint();
        }
    }

    function _transaction(
        Role storage role,
        bytes calldata data,
        UnwrappedTransaction memory transaction
    ) private view returns (Status, Trace[] memory) {
        return
            _transaction(
                role,
                transaction.to,
                transaction.value,
                data[transaction.dataOffset:transaction.dataOffset +
                    transaction.dataLength],
                transaction.operation
            );
    }

    /// @dev Inspects an individual transaction and performs checks based on permission scoping.
    /// Wildcarded indicates whether params need to be inspected or not. When true, only ExecutionOptions are checked.
    /// @param role Role to check for.
    /// @param targetAddress Destination address of transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    function _transaction(
        Role storage role,
        address targetAddress,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) private view returns (Status, Trace[] memory trace) {
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        TargetAddress storage target = role.targets[targetAddress];

        if (target.clearance == Clearance.Target) {
            return (_executionOptions(value, operation, target.options), trace);
        } else if (target.clearance == Clearance.Function) {
            bytes32 key = _key(targetAddress, bytes4(data));
            bytes32 header = role.scopeConfig[key];
            if (header == 0) {
                return (Status.FunctionNotAllowed, trace);
            }

            (, bool isWildcarded, ExecutionOptions options, ) = ScopeConfig
                .unpackHeader(header);

            Status status = _executionOptions(value, operation, options);
            if (status != Status.Ok) {
                return (status, trace);
            }

            if (isWildcarded) {
                return (Status.Ok, trace);
            }

            Condition memory condition = _load(role, key);
            ParameterPayload memory payload = Decoder.inspect(data, condition);

            return _walk(value, data, condition, payload);
        } else {
            return (Status.TargetAddressNotAllowed, trace);
        }
    }

    /// @dev Examines the ether value and operation for a given role target.
    /// @param value Ether value of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    /// @param options Determines if a transaction can send ether and/or delegatecall to target.
    function _executionOptions(
        uint256 value,
        Enum.Operation operation,
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
            operation == Enum.Operation.DelegateCall &&
            options != ExecutionOptions.DelegateCall &&
            options != ExecutionOptions.Both
        ) {
            return Status.DelegateCallNotAllowed;
        }

        return Status.Ok;
    }

    function _walk(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) internal pure returns (Status, Trace[] memory trace) {
        Operator operator = condition.operator;

        if (operator < Operator.EqualTo) {
            if (operator == Operator.Whatever) {
                return (Status.Ok, trace);
            } else if (operator == Operator.Matches) {
                return _matches(value, data, condition, payload);
            } else if (operator == Operator.And) {
                return _and(value, data, condition, payload);
            } else if (operator == Operator.Or) {
                return _or(value, data, condition, payload);
            } else if (operator == Operator.ArraySome) {
                return _arraySome(value, data, condition, payload);
            } else if (operator == Operator.ArrayEvery) {
                return _arrayEvery(value, data, condition, payload);
            } else {
                assert(operator == Operator.ArraySubset);
                return _arraySubset(value, data, condition, payload);
            }
        } else {
            if (operator <= Operator.LessThan) {
                return _compare(data, condition, payload);
            } else if (operator == Operator.Bitmask) {
                return _bitmask(data, condition, payload);
            } else if (operator == Operator.WithinAllowance) {
                return _withinAllowance(data, condition, payload);
            } else if (operator == Operator.ETHWithinAllowance) {
                return _ethWithinAllowance(value, condition);
            } else {
                assert(operator == Operator.CallWithinAllowance);
                return _callWithinAllowance(condition);
            }
        }
    }

    function _matches(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        if (condition.children.length != payload.children.length) {
            return (Status.ParameterNotAMatch, trace);
        }

        for (uint256 i; i < condition.children.length; ) {
            (Status status, Trace[] memory more) = _walk(
                value,
                data,
                condition.children[i],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return (status, _trace());
            }
            trace = _trace(trace, more);
            unchecked {
                ++i;
            }
        }

        return (Status.Ok, trace);
    }

    function _and(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        for (uint256 i; i < condition.children.length; ) {
            (Status status, Trace[] memory more) = _walk(
                value,
                data,
                condition.children[i],
                payload
            );
            if (status != Status.Ok) {
                return (status, _trace());
            }
            trace = _trace(trace, more);
            unchecked {
                ++i;
            }
        }
        return (Status.Ok, trace);
    }

    function _or(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory) {
        for (uint256 i; i < condition.children.length; ) {
            (Status status, Trace[] memory trace) = _walk(
                value,
                data,
                condition.children[i],
                payload
            );
            if (status == Status.Ok) {
                return (status, trace);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.NoMatchingBranch, _trace());
    }

    function _arrayEvery(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        for (uint256 i; i < payload.children.length; ) {
            (Status status, Trace[] memory more) = _walk(
                value,
                data,
                condition.children[0],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return (Status.NotEveryArrayElementPasses, _trace());
            }
            trace = _trace(trace, more);
            unchecked {
                ++i;
            }
        }
        return (Status.Ok, trace);
    }

    function _arraySome(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory trace) {
        for (uint256 i; i < payload.children.length; ) {
            (status, trace) = _walk(
                value,
                data,
                condition.children[0],
                payload.children[i]
            );
            if (status == Status.Ok) {
                return (status, trace);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.NoArrayElementPasses, _trace());
    }

    function _arraySubset(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        ParameterPayload[] memory payloads = payload.children;
        if (payloads.length == 0) {
            return (Status.ParameterNotSubsetOfAllowed, trace);
        }
        Condition[] memory conditions = condition.children;

        uint256 taken;
        for (uint256 i; i < payloads.length; ++i) {
            bool found = false;
            for (uint256 j; j < conditions.length; ++j) {
                if (taken & (1 << j) != 0) continue;

                (Status status, Trace[] memory more) = _walk(
                    value,
                    data,
                    conditions[j],
                    payloads[i]
                );
                if (status == Status.Ok) {
                    found = true;
                    taken |= 1 << j;
                    trace = _trace(trace, more);
                    break;
                }
            }
            if (!found) {
                return (Status.ParameterNotSubsetOfAllowed, _trace());
            }
        }
        return (Status.Ok, trace);
    }

    function _compare(
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory trace) {
        Operator operator = condition.operator;
        bytes32 compValue = condition.compValue;
        bytes32 value = _pluck(data, condition, payload);

        if (operator == Operator.EqualTo && value != compValue) {
            status = Status.ParameterNotAllowed;
        } else if (operator == Operator.GreaterThan && value <= compValue) {
            status = Status.ParameterLessThanAllowed;
        } else if (operator == Operator.LessThan && value >= compValue) {
            status = Status.ParameterGreaterThanAllowed;
        } else {
            status = Status.Ok;
        }

        return (status, trace);
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
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory nothing) {
        bytes32 compValue = condition.compValue;
        bool isInline = condition.paramType == ParameterType.Static;
        bytes calldata value = Decoder.pluck(
            data,
            payload.location + (isInline ? 0 : 32),
            payload.size - (isInline ? 0 : 32)
        );

        uint256 shift = uint16(bytes2(compValue));
        if (shift >= value.length) {
            return (Status.BitmaskOverflow, nothing);
        }

        bytes32 rinse = bytes15(0xffffffffffffffffffffffffffffff);
        bytes32 mask = (compValue << 16) & rinse;
        bytes32 expected = (compValue << (16 + 15 * 8)) & rinse;
        bytes32 slice = bytes32(value[shift:]);

        status = (slice & mask) == expected
            ? Status.Ok
            : Status.BitmaskNotAllowed;
    }

    function _withinAllowance(
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory) {
        uint256 value = uint256(
            bytes32(Decoder.pluck(data, payload.location, payload.size))
        );

        return (Status.Ok, _trace(Trace({condition: condition, value: value})));
    }

    function _ethWithinAllowance(
        uint256 value,
        Condition memory condition
    ) private pure returns (Status status, Trace[] memory) {
        return (Status.Ok, _trace(Trace({condition: condition, value: value})));
    }

    function _callWithinAllowance(
        Condition memory condition
    ) private pure returns (Status status, Trace[] memory) {
        return (Status.Ok, _trace(Trace({condition: condition, value: 1})));
    }

    function _pluck(
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (bytes32) {
        bytes calldata value = Decoder.pluck(
            data,
            payload.location,
            payload.size
        );
        return
            condition.operator == Operator.EqualTo
                ? keccak256(value)
                : bytes32(value);
    }

    function revertWith(Status status) private pure returns (bool) {
        if (status == Status.DelegateCallNotAllowed) {
            revert DelegateCallNotAllowed();
        } else if (status == Status.TargetAddressNotAllowed) {
            revert TargetAddressNotAllowed();
        } else if (status == Status.FunctionNotAllowed) {
            revert FunctionNotAllowed();
        } else if (status == Status.SendNotAllowed) {
            revert SendNotAllowed();
        } else if (status == Status.ParameterNotAllowed) {
            revert ParameterNotAllowed();
        } else if (status == Status.ParameterLessThanAllowed) {
            revert ParameterLessThanAllowed();
        } else if (status == Status.ParameterGreaterThanAllowed) {
            revert ParameterGreaterThanAllowed();
        } else if (status == Status.ParameterNotAMatch) {
            revert ParameterNotAMatch();
        } else if (status == Status.NoMatchingBranch) {
            revert NoMatchingBranch();
        } else if (status == Status.NotEveryArrayElementPasses) {
            revert NotEveryArrayElementPasses();
        } else if (status == Status.NoArrayElementPasses) {
            revert NoArrayElementPasses();
        } else if (status == Status.ParameterNotSubsetOfAllowed) {
            revert ParameterNotSubsetOfAllowed();
        } else if (status == Status.BitmaskOverflow) {
            revert BitmaskOverflow();
        } else {
            assert(status == Status.BitmaskNotAllowed);
            revert BitmaskNotAllowed();
        }
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
        /// Parameter value is not equal to allowed
        ParameterNotAllowed,
        /// Parameter value less than allowed
        ParameterLessThanAllowed,
        /// Parameter value greater than maximum allowed by role
        ParameterGreaterThanAllowed,
        /// Parameter value does not match
        ParameterNotAMatch,
        /// An order condition was not met
        NoMatchingBranch,
        /// Array elements do not meet allowed criteria for every element
        NotEveryArrayElementPasses,
        /// Array elements do not meet allowed criteria for at least one element
        NoArrayElementPasses,
        /// Parameter value not a subset of allowed
        ParameterNotSubsetOfAllowed,
        /// Bitmask exceeded value length
        BitmaskOverflow,
        /// Bitmask not an allowed value
        BitmaskNotAllowed
    }

    /// Sender is not a member of the role
    error NoMembership();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Calldata unwrapping failed
    error MalformedMultiEntrypoint();

    /// Role not allowed to delegate call to target address
    error DelegateCallNotAllowed();

    /// Role not allowed to call target address
    error TargetAddressNotAllowed();

    /// Role not allowed to send to target address
    error SendNotAllowed();

    /// Role not allowed to call this function on target address
    error FunctionNotAllowed();

    /// Parameter value not one of allowed
    error ParameterNotAllowed();

    /// Parameter value less than minimum
    error ParameterLessThanAllowed();

    /// Parameter value greater than maximum
    error ParameterGreaterThanAllowed();

    /// Parameter value does not match specified condition
    error ParameterNotAMatch();

    error NoMatchingBranch();

    /// Array elements do not meet allowed criteria for every element
    error NotEveryArrayElementPasses();

    /// Array elements do not meet allowed criteria for at least one element
    error NoArrayElementPasses();

    /// Parameter value not a subset of allowed values
    error ParameterNotSubsetOfAllowed();

    /// only multisend txs with an offset of 32 bytes are allowed
    error UnacceptableMultiSendOffset();

    /// Bitmask exceeded value length
    error BitmaskOverflow();

    /// Bitmask not an allowed value
    error BitmaskNotAllowed();

    function _trace() private pure returns (Trace[] memory result) {}

    function _trace(
        Trace memory entry
    ) private pure returns (Trace[] memory result) {
        result = new Trace[](1);
        result[0] = entry;
    }

    function _trace(
        Trace[] memory t1,
        Trace[] memory t2
    ) private pure returns (Trace[] memory result) {
        if (t1.length == 0) return t2;
        if (t2.length == 0) return t1;

        result = new Trace[](t1.length + t2.length);

        uint i;
        for (i; i < t1.length; ++i) {
            result[i] = t1[i];
        }

        for (uint256 j; j < t2.length; ++j) {
            result[i++] = t2[j];
        }
    }
}
