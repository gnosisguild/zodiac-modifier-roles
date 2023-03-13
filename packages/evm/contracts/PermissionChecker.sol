// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

import "./Core.sol";
import "./Periphery.sol";
import "./Decoder.sol";
import "./ScopeConfig.sol";

abstract contract PermissionChecker is Core, Periphery {
    /// @dev Entry point for checking the scope of a transaction.
    function authorize(
        uint16 roleId,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) internal view returns (Trace[] memory result) {
        if (!roles[roleId].members[msg.sender]) {
            revert NoMembership();
        }

        /*
         *
         * Optimized version of
         * bytes32(abi.encodePacked(to, bytes4(data)))
         *
         */
        bytes32 key = bytes32(bytes20(to)) | (bytes32(bytes4(data)) >> (160));

        address adapter = unwrappers[key];
        if (adapter == address(0)) {
            return _singleEntrypoint(roleId, to, value, data, operation);
        } else {
            return
                _multiEntrypoint(
                    ITransactionUnwrapper(adapter),
                    roleId,
                    to,
                    value,
                    data,
                    operation
                );
        }
    }

    function _singleEntrypoint(
        uint16 roleId,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) private view returns (Trace[] memory) {
        (Status status, Trace[] memory result) = _transaction(
            roleId,
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
        uint16 roleId,
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
                    roleId,
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
        uint16 roleId,
        bytes calldata data,
        UnwrappedTransaction memory transaction
    ) private view returns (Status, Trace[] memory) {
        return
            _transaction(
                roleId,
                transaction.to,
                transaction.value,
                data[transaction.dataOffset:transaction.dataOffset +
                    transaction.dataLength],
                transaction.operation
            );
    }

    /// @dev Inspects an individual transaction and performs checks based on permission scoping.
    /// Wildcarded indicates whether params need to be inspected or not. When true, only ExecutionOptions are checked.
    /// @param roleId Role to check for.
    /// @param targetAddress Destination address of transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    function _transaction(
        uint16 roleId,
        address targetAddress,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) private view returns (Status, Trace[] memory nothing) {
        if (data.length != 0 && data.length < 4) {
            return (Status.FunctionSignatureTooShort, nothing);
        }

        Role storage role = roles[roleId];
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
            ParameterPayload memory payload = Decoder.inspect(
                data,
                Topology.typeTree(parameter)
            );

            return _walk(data, parameter, payload);
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
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) internal pure returns (Status, Trace[] memory nothing) {
        if (parameter.comp == Comparison.Whatever) {
            return (Status.Ok, nothing);
        }

        Comparison comp = parameter.comp;
        if (
            comp == Comparison.EqualTo ||
            comp == Comparison.GreaterThan ||
            comp == Comparison.LessThan
        ) {
            return _compare(data, parameter, payload);
        } else if (comp == Comparison.Matches) {
            return _matches(data, parameter, payload);
        } else if (comp == Comparison.OneOf) {
            return _oneOf(data, parameter, payload);
        } else if (comp == Comparison.ArraySome) {
            return _arraySome(data, parameter, payload);
        } else if (comp == Comparison.ArrayEvery) {
            return _arrayEvery(data, parameter, payload);
        } else if (comp == Comparison.WithinAllowance) {
            return _withinAllowance(data, parameter, payload);
        } else if (comp == Comparison.SubsetOf) {
            return _subsetOf(data, parameter, payload);
        } else {
            assert(comp == Comparison.Bitmask);
            return _bitmask(data, parameter, payload);
        }
    }

    function _oneOf(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory nothing) {
        for (uint256 i; i < parameter.children.length; ++i) {
            (Status status, Trace[] memory trace) = _walk(
                data,
                parameter.children[i],
                payload
            );
            if (status == Status.Ok) {
                return (status, trace);
            }
        }
        return (Status.ParameterNotOneOfAllowed, nothing);
    }

    function _matches(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        if (parameter.children.length != payload.children.length) {
            return (Status.ParameterNotAMatch, trace);
        }

        for (uint256 i; i < parameter.children.length; ++i) {
            (Status status, Trace[] memory more) = _walk(
                data,
                parameter.children[i],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return (status, _trace());
            }
            trace = _trace(trace, more);
        }

        return (Status.Ok, trace);
    }

    function _arrayEvery(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Trace[] memory trace) {
        for (uint256 i; i < payload.children.length; ++i) {
            (Status status, Trace[] memory more) = _walk(
                data,
                parameter.children[0],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return (Status.ArrayElementsNotAllowed, _trace());
            }
            trace = _trace(trace, more);
        }
        return (Status.Ok, trace);
    }

    function _arraySome(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory trace) {
        for (uint256 i; i < payload.children.length; ++i) {
            (status, trace) = _walk(
                data,
                parameter.children[0],
                payload.children[i]
            );
            if (status == Status.Ok) {
                return (status, trace);
            }
        }
        return (Status.ArrayElementsSomeNotAllowed, _trace());
    }

    function _subsetOf(
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

    function _withinAllowance(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory nothing) {
        assert(parameter._type == ParameterType.Static);

        bytes32 value = bytes32(
            Decoder.pluck(data, payload.location, payload.size)
        );

        uint256 amount = uint256(value);
        if (amount > parameter.allowance) {
            return (Status.AllowanceExceeded, nothing);
        }

        return (Status.Ok, _trace(Trace({config: parameter, value: value})));
    }

    function _bitmask(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory nothing) {
        bytes32 compValue = parameter.compValue;
        bytes calldata value = Decoder.pluck(
            data,
            payload.location,
            payload.size
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

    function _compare(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Trace[] memory nothing) {
        assert(
            parameter.comp == Comparison.EqualTo ||
                parameter.comp == Comparison.GreaterThan ||
                parameter.comp == Comparison.LessThan
        );

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
        return parameter.isHashed ? keccak256(value) : bytes32(value);
    }

    function revertWith(Status status) public pure returns (bool) {
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
        /// Allowance exceeded
        AllowanceExceeded,
        /// Allowance was double spent
        AllowanceDoubleSpend,
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
