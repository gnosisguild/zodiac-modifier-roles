// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

import "./Core.sol";
import "./Periphery.sol";

import "./Consumptions.sol";
import "./Decoder.sol";
import "./ScopeConfig.sol";

/**
 * @title PermissionChecker - a component of Zodiac Roles Mod responsible
 * for enforcing and authorizing actions performed on behalf of a role.
 *
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.pm>
 */
abstract contract PermissionChecker is Core, Periphery {
    function authorize(
        bytes32 roleKey,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) internal view returns (Consumption[] memory) {
        // We never authorize the zero role, as it could clash with the
        // unassigned default role
        if (roleKey == 0) {
            revert NoMembership();
        }

        Role storage role = roles[roleKey];
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
    ) private view returns (Consumption[] memory result) {
        Status status;
        (status, result) = _transaction(
            role,
            to,
            value,
            data,
            operation,
            result
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
    ) private view returns (Consumption[] memory result) {
        try adapter.unwrap(to, value, data, operation) returns (
            UnwrappedTransaction[] memory transactions
        ) {
            for (uint256 i; i < transactions.length; ) {
                Status status;

                UnwrappedTransaction memory transaction = transactions[i];
                uint256 left = transaction.dataOffset;
                uint256 right = left + transaction.dataLength;
                (status, result) = _transaction(
                    role,
                    transaction.to,
                    transaction.value,
                    data[left:right],
                    transaction.operation,
                    result
                );
                if (status != Status.Ok) {
                    revertWith(status);
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
    /// @param targetAddress Destination address of transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    function _transaction(
        Role storage role,
        address targetAddress,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        Consumption[] memory consumptions
    ) private view returns (Status, Consumption[] memory) {
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        TargetAddress storage target = role.targets[targetAddress];

        if (target.clearance == Clearance.Target) {
            return (
                _executionOptions(value, operation, target.options),
                consumptions
            );
        } else if (target.clearance == Clearance.Function) {
            bytes32 key = _key(targetAddress, bytes4(data));
            bytes32 header = role.scopeConfig[key];
            if (header == 0) {
                return (Status.FunctionNotAllowed, consumptions);
            }

            (, bool isWildcarded, ExecutionOptions options, ) = ScopeConfig
                .unpackHeader(header);

            Status status = _executionOptions(value, operation, options);
            if (status != Status.Ok) {
                return (status, consumptions);
            }

            if (isWildcarded) {
                return (Status.Ok, consumptions);
            }

            return _scopedFunction(role, key, value, data, consumptions);
        } else {
            return (Status.TargetAddressNotAllowed, consumptions);
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

    function _scopedFunction(
        Role storage role,
        bytes32 key,
        uint256 value,
        bytes calldata data,
        Consumption[] memory prevConsumptions
    ) private view returns (Status, Consumption[] memory) {
        (
            Condition memory condition,
            Consumption[] memory currConsumptions
        ) = _load(role, key);
        ParameterPayload memory payload = Decoder.inspect(data, condition);

        return
            _walk(
                value,
                data,
                condition,
                payload,
                // merge should be avoided at its an external library
                // and will trigger a full memory copy as it steps to it
                prevConsumptions.length == 0
                    ? currConsumptions
                    : Consumptions.merge(prevConsumptions, currConsumptions)
            );
    }

    function _walk(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory c
    ) private pure returns (Status, Consumption[] memory) {
        Operator operator = condition.operator;

        // try most common upfront
        if (operator == Operator.Pass) {
            return (Status.Ok, c);
        } else if (operator == Operator.EqualTo) {
            return (_compare(data, condition, payload), c);
        } else if (operator == Operator.Matches) {
            return _matches(value, data, condition, payload, c);
        }

        if (operator < Operator.EqualTo) {
            if (operator == Operator.And) {
                return _and(value, data, condition, payload, c);
            } else if (operator == Operator.Or) {
                return _or(value, data, condition, payload, c);
            } else if (operator == Operator.Nor) {
                return _nor(value, data, condition, payload, c);
            } else if (operator == Operator.Xor) {
                return _xor(value, data, condition, payload, c);
            } else if (operator == Operator.ArraySome) {
                return _arraySome(value, data, condition, payload, c);
            } else if (operator == Operator.ArrayEvery) {
                return _arrayEvery(value, data, condition, payload, c);
            } else {
                assert(operator == Operator.ArraySubset);
                return _arraySubset(value, data, condition, payload, c);
            }
        } else {
            if (operator <= Operator.LessThan) {
                return (_compare(data, condition, payload), c);
            } else if (operator <= Operator.SignedIntLessThan) {
                return (_compareSignedInt(data, condition, payload), c);
            } else if (operator == Operator.Bitmask) {
                return (_bitmask(data, condition, payload), c);
            } else if (operator == Operator.WithinAllowance) {
                return _withinAllowance(data, condition, payload, c);
            } else if (operator == Operator.EtherWithinAllowance) {
                return _etherWithinAllowance(value, condition, c);
            } else {
                assert(operator == Operator.CallWithinAllowance);
                return _callWithinAllowance(condition, c);
            }
        }
    }

    function _matches(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status, Consumption[] memory) {
        if (condition.children.length != payload.children.length) {
            return (Status.ParameterNotAMatch, consumptions);
        }

        Consumption[] memory result = _clone(consumptions);
        for (uint256 i; i < condition.children.length; ) {
            Status status;
            (status, result) = _walk(
                value,
                data,
                condition.children[i],
                payload.children[i],
                result
            );
            if (status != Status.Ok) {
                return (status, consumptions);
            }
            unchecked {
                ++i;
            }
        }

        return (Status.Ok, result);
    }

    function _and(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory) {
        Consumption[] memory result = _clone(consumptions);

        for (uint256 i; i < condition.children.length; ) {
            (status, result) = _walk(
                value,
                data,
                condition.children[i],
                payload,
                result
            );
            if (status != Status.Ok) {
                return (status, consumptions);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.Ok, result);
    }

    function _or(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory result) {
        for (uint256 i; i < condition.children.length; ) {
            (status, result) = _walk(
                value,
                data,
                condition.children[i],
                payload,
                _clone(consumptions)
            );
            if (status == Status.Ok) {
                return (status, result);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.OrViolation, consumptions);
    }

    function _nor(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory) {
        for (uint256 i; i < condition.children.length; ) {
            (status, ) = _walk(
                value,
                data,
                condition.children[i],
                payload,
                _clone(consumptions)
            );
            if (status == Status.Ok) {
                return (Status.NorViolation, consumptions);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.Ok, consumptions);
    }

    function _xor(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status, Consumption[] memory result) {
        uint256 okCount;
        for (uint256 i; i < condition.children.length; ) {
            (Status status, Consumption[] memory temp) = _walk(
                value,
                data,
                condition.children[i],
                payload,
                _clone(consumptions)
            );
            if (status == Status.Ok) {
                result = temp;
                okCount = okCount + 1;
            }
            unchecked {
                ++i;
            }
        }

        return
            okCount == 1
                ? (Status.Ok, result)
                : (Status.XorViolation, consumptions);
    }

    function _arraySome(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory result) {
        for (uint256 i; i < payload.children.length; ) {
            (status, result) = _walk(
                value,
                data,
                condition.children[0],
                payload.children[i],
                _clone(consumptions)
            );
            if (status == Status.Ok) {
                return (status, result);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.NoArrayElementPasses, consumptions);
    }

    function _arrayEvery(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory result) {
        result = _clone(consumptions);
        for (uint256 i; i < payload.children.length; ) {
            (status, result) = _walk(
                value,
                data,
                condition.children[0],
                payload.children[i],
                result
            );
            if (status != Status.Ok) {
                return (Status.NotEveryArrayElementPasses, consumptions);
            }
            unchecked {
                ++i;
            }
        }
        return (Status.Ok, result);
    }

    function _arraySubset(
        uint256 value,
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status, Consumption[] memory result) {
        assert(condition.children.length <= 256);

        result = consumptions;

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

                (Status status, Consumption[] memory temp) = _walk(
                    value,
                    data,
                    condition.children[j],
                    payload.children[i],
                    _clone(result)
                );
                if (status == Status.Ok) {
                    found = true;
                    taken |= 1 << j;
                    result = temp;
                    break;
                }
            }
            if (!found) {
                return (Status.ParameterNotSubsetOfAllowed, consumptions);
            }
        }
        return (Status.Ok, result);
    }

    function _compare(
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload
    ) private pure returns (Status status) {
        bytes calldata plucked = Decoder.pluck(
            data,
            payload.location,
            payload.size
        );
        Operator operator = condition.operator;
        bytes32 compValue = condition.compValue;
        bytes32 value = operator == Operator.EqualTo
            ? keccak256(plucked)
            : bytes32(plucked);

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
        ParameterPayload memory payload
    ) private pure returns (Status status) {
        bytes calldata plucked = Decoder.pluck(
            data,
            payload.location,
            payload.size
        );
        Operator operator = condition.operator;
        int256 compValue = int256(uint256(condition.compValue));
        int256 value = int256(uint256(bytes32(plucked)));

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
        ParameterPayload memory payload
    ) private pure returns (Status status) {
        bytes32 compValue = condition.compValue;
        bool isInline = condition.paramType == ParameterType.Static;
        bytes calldata value = Decoder.pluck(
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

    function _withinAllowance(
        bytes calldata data,
        Condition memory condition,
        ParameterPayload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Status, Consumption[] memory) {
        uint256 value = uint256(
            bytes32(Decoder.pluck(data, payload.location, payload.size))
        );
        return __allowance(value, condition, consumptions);
    }

    function _etherWithinAllowance(
        uint256 value,
        Condition memory condition,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory result) {
        (status, result) = __allowance(value, condition, consumptions);
        return (
            status == Status.Ok ? Status.Ok : Status.EtherAllowanceExceeded,
            result
        );
    }

    function _callWithinAllowance(
        Condition memory condition,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory result) {
        (status, result) = __allowance(1, condition, consumptions);
        return (
            status == Status.Ok ? Status.Ok : Status.CallAllowanceExceeded,
            result
        );
    }

    function __allowance(
        uint256 value,
        Condition memory condition,
        Consumption[] memory consumptions
    ) private pure returns (Status status, Consumption[] memory) {
        (uint256 index, bool found) = _find(consumptions, condition.compValue);
        assert(found == true);

        if (
            value + consumptions[index].consumed > consumptions[index].balance
        ) {
            return (Status.AllowanceExceeded, consumptions);
        }
        consumptions[index].consumed += uint128(value);

        return (Status.Ok, consumptions);
    }

    function revertWith(Status status) private pure returns (bool) {
        if (status == Status.DelegateCallNotAllowed) {
            revert DelegateCallNotAllowed();
        } else if (status == Status.TargetAddressNotAllowed) {
            revert TargetAddressNotAllowed();
        } else if (status == Status.FunctionNotAllowed) {
            revert FunctionNotAllowed();
        } else if (status == Status.OrViolation) {
            revert OrViolation();
        } else if (status == Status.NorViolation) {
            revert NorViolation();
        } else if (status == Status.XorViolation) {
            revert XorViolation();
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
        } else if (status == Status.NotEveryArrayElementPasses) {
            revert NotEveryArrayElementPasses();
        } else if (status == Status.NoArrayElementPasses) {
            revert NoArrayElementPasses();
        } else if (status == Status.ParameterNotSubsetOfAllowed) {
            revert ParameterNotSubsetOfAllowed();
        } else if (status == Status.BitmaskOverflow) {
            revert BitmaskOverflow();
        } else if (status == Status.BitmaskNotAllowed) {
            revert BitmaskNotAllowed();
        } else if (status == Status.AllowanceExceeded) {
            revert AllowanceExceeded();
        } else if (status == Status.CallAllowanceExceeded) {
            revert CallAllowanceExceeded();
        } else {
            assert(status == Status.EtherAllowanceExceeded);
            revert EtherAllowanceExceeded();
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
        /// Or conition not met
        OrViolation,
        /// Nor conition not met
        NorViolation,
        /// Xor conition not met
        XorViolation,
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
        /// TODO
        AllowanceExceeded,
        /// TODO
        CallAllowanceExceeded,
        /// TODO
        EtherAllowanceExceeded
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

    error OrViolation();

    error NorViolation();

    error XorViolation();

    /// Parameter value not one of allowed
    error ParameterNotAllowed();

    /// Parameter value less than minimum
    error ParameterLessThanAllowed();

    /// Parameter value greater than maximum
    error ParameterGreaterThanAllowed();

    /// Parameter value does not match specified condition
    error ParameterNotAMatch();

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

    error AllowanceExceeded();

    error CallAllowanceExceeded();

    error EtherAllowanceExceeded();

    function _find(
        Consumption[] memory consumptions,
        bytes32 key
    ) private pure returns (uint256, bool) {
        uint256 length = consumptions.length;
        for (uint256 i; i < length; ++i) {
            if (consumptions[i].allowanceKey == key) {
                return (i, true);
            }
        }

        return (0, false);
    }

    function _clone(
        Consumption[] memory consumptions
    ) private pure returns (Consumption[] memory result) {
        if (consumptions.length == 0) {
            return result;
        }

        uint256 length = consumptions.length;
        result = new Consumption[](length);
        for (uint256 i; i < length; ++i) {
            result[i].allowanceKey = consumptions[i].allowanceKey;
            result[i].balance = consumptions[i].balance;
            result[i].consumed = consumptions[i].consumed;
        }
    }
}
