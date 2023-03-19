// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

import "./Core.sol";
import "./Periphery.sol";
import "./Decoder.sol";
import "./ScopeConfig.sol";

abstract contract PermissionChecker is Core, Periphery {
    /// @dev Entry point for checking the scope of a transaction.
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
            for (uint256 i; i < transactions.length; ++i) {
                (Status status, Trace[] memory more) = _transaction(
                    role,
                    data,
                    transactions[i]
                );
                if (status != Status.Ok) {
                    revertWith(status);
                }
                result = _trace(result, more);
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
    ) private view returns (Status, Trace[] memory nothing) {
        if (data.length != 0 && data.length < 4) {
            return (Status.FunctionSignatureTooShort, nothing);
        }

        TargetAddress storage target = role.targets[targetAddress];

        if (target.clearance == Clearance.Target) {
            return (
                _executionOptions(value, operation, target.options),
                nothing
            );
        } else if (target.clearance == Clearance.Function) {
            bytes32 key = _key(targetAddress, bytes4(data));
            bytes32 header = role.scopeConfig[key];
            if (header == 0) {
                return (Status.FunctionNotAllowed, nothing);
            }

            (, bool isWildcarded, ExecutionOptions options, ) = ScopeConfig
                .unpackHeader(header);

            Status status = _executionOptions(value, operation, options);
            if (status != Status.Ok) {
                return (status, nothing);
            }

            if (isWildcarded) {
                return (Status.Ok, nothing);
            }

            ParameterConfig memory parameter = _load(role, key);
            ParameterPayload memory payload = Decoder.inspect(data, parameter);

            return _walk(value, data, parameter, payload);
        } else {
            return (Status.TargetAddressNotAllowed, nothing);
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
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) internal pure returns (Status, Trace[] memory nothing) {
        Comparison comp = parameter.comp;

        if (comp < Comparison.EqualTo) {
            if (comp == Comparison.Whatever) {
                return (Status.Ok, nothing);
            } else if (comp == Comparison.Matches) {
                return _matches(value, data, parameter, payload);
            } else if (comp == Comparison.And) {
                return _and(value, data, parameter, payload);
            } else if (comp == Comparison.Or) {
                return _or(value, data, parameter, payload);
            } else if (comp == Comparison.SubsetOf) {
                return _subsetOf(value, data, parameter, payload);
            } else if (comp == Comparison.ArraySome) {
                return _arraySome(value, data, parameter, payload);
            } else {
                assert(comp == Comparison.ArrayEvery);
                return _arrayEvery(value, data, parameter, payload);
            }
        } else {
            if (comp <= Comparison.LessThan) {
                return _compare(data, parameter, payload);
            } else if (comp == Comparison.Bitmask) {
                return _bitmask(data, parameter, payload);
            } else if (comp == Comparison.WithinAllowance) {
                return _withinAllowance(data, parameter, payload);
            } else if (comp == Comparison.ETHWithinAllowance) {
                return _ethWithinAllowance(value, parameter);
            } else {
                assert(comp == Comparison.CallWithinAllowance);
                return _callWithinAllowance(parameter);
            }
        }
    }

    function _matches(
        uint256 value,
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        if (parameter.children.length != payload.children.length) {
            return (Status.ParameterNotAMatch, trace);
        }

        for (uint256 i; i < parameter.children.length; ) {
            (Status status, Trace[] memory more) = _walk(
                value,
                data,
                parameter.children[i],
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
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        for (uint256 i; i < parameter.children.length; ) {
            (Status status, Trace[] memory more) = _walk(
                value,
                data,
                parameter.children[i],
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
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory nothing) {
        for (uint256 i; i < parameter.children.length; ) {
            (Status status, Trace[] memory trace) = _walk(
                value,
                data,
                parameter.children[i],
                payload
            );
            if (status == Status.Ok) {
                return (status, trace);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.ParameterNotOneOfAllowed, nothing);
    }

    function _subsetOf(
        uint256 value,
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        ParameterPayload[] memory values = payload.children;
        if (values.length == 0) {
            return (Status.ParameterNotSubsetOfAllowed, trace);
        }
        ParameterConfig[] memory compValues = parameter.children;

        uint256 taken;
        for (uint256 i; i < values.length; ++i) {
            bool found = false;
            for (uint256 j; j < compValues.length; ++j) {
                if (taken & (1 << j) != 0) continue;

                (Status status, Trace[] memory more) = _walk(
                    value,
                    data,
                    compValues[j],
                    values[i]
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

    function _arrayEvery(
        uint256 value,
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        for (uint256 i; i < payload.children.length; ) {
            (Status status, Trace[] memory more) = _walk(
                value,
                data,
                parameter.children[0],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return (Status.ArrayElementsNotAllowed, _trace());
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
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory trace) {
        for (uint256 i; i < payload.children.length; ) {
            (status, trace) = _walk(
                value,
                data,
                parameter.children[0],
                payload.children[i]
            );
            if (status == Status.Ok) {
                return (status, trace);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.ArrayElementsSomeNotAllowed, _trace());
    }

    function _compare(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory nothing) {
        Comparison comp = parameter.comp;
        bytes32 compValue = parameter.compValue;
        bytes32 value = _pluck(data, parameter, payload);

        if (comp == Comparison.EqualTo && value != compValue) {
            status = Status.ParameterNotAllowed;
        } else if (comp == Comparison.GreaterThan && value <= compValue) {
            status = Status.ParameterLessThanAllowed;
        } else if (comp == Comparison.LessThan && value >= compValue) {
            status = Status.ParameterGreaterThanAllowed;
        } else {
            status = Status.Ok;
        }

        return (status, nothing);
    }

    function _bitmask(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory nothing) {
        bytes32 compValue = parameter.compValue;
        bool isInline = parameter._type == ParameterType.Static;
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
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory nothing) {
        uint256 value = uint256(
            bytes32(Decoder.pluck(data, payload.location, payload.size))
        );
        if (value > parameter.allowance) {
            return (Status.AllowanceExceeded, nothing);
        }

        return (Status.Ok, _trace(Trace({condition: parameter, value: value})));
    }

    function _ethWithinAllowance(
        uint256 value,
        ParameterConfig memory parameter
    ) private pure returns (Status status, Trace[] memory nothing) {
        if (value > parameter.allowance) {
            return (Status.ETHAllowanceExceeded, nothing);
        }

        return (Status.Ok, _trace(Trace({condition: parameter, value: value})));
    }

    function _callWithinAllowance(
        ParameterConfig memory parameter
    ) private pure returns (Status status, Trace[] memory nothing) {
        if (parameter.allowance == 0) {
            return (Status.CallAllowanceExceeded, nothing);
        }

        return (Status.Ok, _trace(Trace({condition: parameter, value: 1})));
    }

    function _pluck(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (bytes32) {
        bytes calldata value = Decoder.pluck(
            data,
            payload.location,
            payload.size
        );
        return
            parameter.comp == Comparison.EqualTo
                ? keccak256(value)
                : bytes32(value);
    }

    function revertWith(Status status) private pure returns (bool) {
        if (status == Status.FunctionSignatureTooShort) {
            revert FunctionSignatureTooShort();
        } else if (status == Status.DelegateCallNotAllowed) {
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
        } else if (status == Status.ParameterNotOneOfAllowed) {
            revert ParameterNotOneOfAllowed();
        } else if (status == Status.ParameterNotAMatch) {
            revert ParameterNotAMatch();
        } else if (status == Status.ArrayElementsNotAllowed) {
            revert ArrayElementsNotAllowed();
        } else if (status == Status.ArrayElementsSomeNotAllowed) {
            revert ArrayElementsSomeNotAllowed();
        } else if (status == Status.ParameterNotSubsetOfAllowed) {
            revert ParameterNotSubsetOfAllowed();
        } else if (status == Status.AllowanceExceeded) {
            revert AllowanceExceeded();
        } else if (status == Status.ETHAllowanceExceeded) {
            revert ETHAllowanceExceeded();
        } else if (status == Status.CallAllowanceExceeded) {
            revert CallAllowanceExceeded();
        } else if (status == Status.BitmaskOverflow) {
            revert BitmaskOverflow();
        } else {
            assert(status == Status.BitmaskNotAllowed);
            revert BitmaskNotAllowed();
        }
    }

    enum Status {
        Ok,
        FunctionSignatureTooShort,
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
        /// Parameter value not a subset of allowed
        ParameterNotOneOfAllowed,
        /// Parameter value does not match
        ParameterNotAMatch,
        /// Array elements do not meet allowed criteria for every element
        ArrayElementsNotAllowed,
        /// Array elements do not meet allowed criteria for at least one element
        ArrayElementsSomeNotAllowed,
        /// Parameter value not a subset of allowed
        ParameterNotSubsetOfAllowed,
        /// Bitmask exceeded value length
        BitmaskOverflow,
        /// Bitmask not an allowed value
        BitmaskNotAllowed,
        /// Allowance exceeded
        AllowanceExceeded,
        /// ETH Allowance exceeded
        ETHAllowanceExceeded,
        /// Call Allowance exceeded
        CallAllowanceExceeded,
        /// Allowance was double spent
        AllowanceDoubleSpend
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

    error ParameterNotOneOfAllowed();

    /// Parameter value does not match specified condition
    error ParameterNotAMatch();

    /// Array elements do not meet allowed criteria for every element
    error ArrayElementsNotAllowed();

    /// Array elements do not meet allowed criteria for at least one element
    error ArrayElementsSomeNotAllowed();

    /// Parameter value not a subset of allowed values
    error ParameterNotSubsetOfAllowed();

    /// only multisend txs with an offset of 32 bytes are allowed
    error UnacceptableMultiSendOffset();

    /// Allowance exceeded
    error AllowanceExceeded();

    /// Allowance exceeded
    error ETHAllowanceExceeded();

    /// Allowance exceeded
    error CallAllowanceExceeded();

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
