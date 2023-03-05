// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

import "./Core.sol";
import "./Decoder.sol";
import "./bitmaps/ScopeConfig.sol";

abstract contract PermissionChecker is Core {
    /// Sender is not a member of the role
    error NoMembership();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Role not allowed to delegate call to target address
    error DelegateCallNotAllowed();

    /// Role not allowed to call target address
    error TargetAddressNotAllowed();

    /// Role not allowed to send to target address
    error SendNotAllowed();

    /// Role not allowed to call this function on target address
    error FunctionNotAllowed();
    error FunctionVariantNotAllowed();

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

    /// Allowance was double spent

    /*
     *
     * CHECKERS
     *
     */

    /// @dev Entry point for checking the scope of a transaction.
    function check(
        uint16 roleId,
        address multisend,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) internal view returns (Tracking[] memory) {
        if (!roles[roleId].members[msg.sender]) {
            revert NoMembership();
        }

        (Status status, Tracking[] memory toBeTracked) = checkTransaction(
            roleId,
            to,
            value,
            data,
            operation
        );
        // if (multisend == to) {
        //     status = checkMultisendTransaction(roleId, data);
        // } else {
        //     status = checkTransaction(roleId, to, value, data, operation);
        // }
        if (status != Status.Ok) {
            revertWith(status);
        }
        return toBeTracked;
    }

    /// @dev Splits a multisend data blob into transactions and forwards them to be checked.
    /// @param data the packed transaction data (created by utils function buildMultiSendSafeTx).
    function checkMultisendTransaction(
        uint16 roleId,
        bytes memory data
    ) internal view returns (Status) {
        Enum.Operation operation;
        address to;
        uint256 value;
        bytes memory out;
        uint256 dataLength;

        uint256 offset;
        assembly {
            offset := mload(add(data, 36))
        }
        if (offset != 32) {
            revert UnacceptableMultiSendOffset();
        }

        // transaction data (1st tx operation) reads at byte 100,
        // 4 bytes (multisend_id) + 32 bytes (offset_multisend_data) + 32 bytes multisend_data_length
        // increment i by the transaction data length
        // + 85 bytes of the to, value, and operation bytes until we reach the end of the data
        for (uint256 i = 100; i < data.length; i += (85 + dataLength)) {
            assembly {
                // First byte of the data is the operation.
                // We shift by 248 bits (256 - 8 [operation byte]) right since mload will always load 32 bytes (a word).
                // This will also zero out unused data.
                operation := shr(0xf8, mload(add(data, i)))
                // We offset the load address by 1 byte (operation byte)
                // We shift it right by 96 bits (256 - 160 [20 address bytes]) to right-align the data and zero out unused data.
                to := shr(0x60, mload(add(data, add(i, 0x01))))
                // We offset the load address by 21 byte (operation byte + 20 address bytes)
                value := mload(add(data, add(i, 0x15)))
                // We offset the load address by 53 byte (operation byte + 20 address bytes + 32 value bytes)
                dataLength := mload(add(data, add(i, 0x35)))
                // We offset the load address by 85 byte (operation byte + 20 address bytes + 32 value bytes + 32 data length bytes)
                out := add(data, add(i, 0x35))
            }
            // Status status = checkTransaction(roleId, to, value, out, operation);
            // if (status != Status.Ok) {
            //     return status;
            // }
        }
        return Status.Ok;
    }

    /// @dev Inspects an individual transaction and performs checks based on permission scoping.
    /// Wildcarded indicates whether params need to be inspected or not. When true, only ExecutionOptions are checked.
    /// @param roleId Role to check for.
    /// @param targetAddress Destination address of transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    function checkTransaction(
        uint16 roleId,
        address targetAddress,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) internal view returns (Status, Tracking[] memory toBeTracked) {
        if (data.length != 0 && data.length < 4) {
            return (Status.FunctionSignatureTooShort, toBeTracked);
        }

        Role storage role = roles[roleId];
        TargetAddress storage target = role.targets[targetAddress];

        if (target.clearance == Clearance.Target) {
            return (
                _checkExecutionOptions(value, operation, target.options),
                _track()
            );
        } else if (target.clearance == Clearance.Function) {
            bytes32 key = _key(targetAddress, bytes4(data));
            bytes32 header = role.scopeConfig[key];
            if (header == 0) {
                return (Status.FunctionNotAllowed, _track());
            }

            (bool isWildcarded, ExecutionOptions options) = ScopeConfig
                .unpackHeader(header);

            Status status = _checkExecutionOptions(value, operation, options);
            if (status != Status.Ok) {
                return (status, _track());
            }

            if (isWildcarded) {
                return (Status.Ok, _track());
            }

            ParameterConfig[] memory parameters = _load(role, key);
            ParameterPayload[] memory payloads = Decoder.inspect(
                data,
                Topology.typeTree(parameters)
            );

            return _checkScope(data, parameters, payloads);
        } else {
            return (Status.TargetAddressNotAllowed, _track());
        }
    }

    /// @dev Examines the ether value and operation for a given role target.
    /// @param value Ether value of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    /// @param options Determines if a transaction can send ether and/or delegatecall to target.
    function _checkExecutionOptions(
        uint256 value,
        Enum.Operation operation,
        ExecutionOptions options
    ) internal pure returns (Status) {
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

    function _checkScope(
        bytes calldata data,
        ParameterConfig[] memory parameters,
        ParameterPayload[] memory payloads
    ) internal pure returns (Status, Tracking[] memory) {
        if (Topology.isVariantEntrypoint(parameters)) {
            return _checkVariants(data, parameters[0].children, payloads);
        } else if (Topology.isExplicitEntrypoint(parameters)) {
            return _entrypoint(data, parameters[0].children, payloads);
        } else {
            return _entrypoint(data, parameters, payloads);
        }
    }

    function _checkVariants(
        bytes calldata data,
        ParameterConfig[] memory variants,
        ParameterPayload[] memory payloads
    ) internal pure returns (Status status, Tracking[] memory toBeTracked) {
        for (uint256 i; i < variants.length; ++i) {
            (status, toBeTracked) = _entrypoint(
                data,
                variants[i].children,
                payloads
            );
            if (status == Status.Ok) {
                return (status, toBeTracked);
            }
        }
        return (Status.FunctionVariantNotAllowed, _track());
    }

    function _entrypoint(
        bytes calldata data,
        ParameterConfig[] memory parameters,
        ParameterPayload[] memory payloads
    ) internal pure returns (Status, Tracking[] memory toBeTracked) {
        assert(parameters.length == payloads.length);

        for (uint256 i; i < parameters.length; ++i) {
            (Status status, Tracking[] memory moreToBeTracked) = _walk(
                data,
                parameters[i],
                payloads[i]
            );
            if (status != Status.Ok) {
                return (status, _track());
            }
            toBeTracked = moreToBeTracked.length == 0
                ? toBeTracked
                : _trackMerge(toBeTracked, moreToBeTracked);
        }
        return (Status.Ok, toBeTracked);
    }

    function _walk(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) internal pure returns (Status, Tracking[] memory) {
        assert(parameter._type != ParameterType.Function);

        if (parameter.comp == Comparison.Whatever) {
            return (Status.Ok, _track());
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
            return _some(data, parameter, payload);
        } else if (comp == Comparison.ArrayEvery) {
            return _every(data, parameter, payload);
        } else if (comp == Comparison.WithinLimit) {
            return _withinLimit(data, parameter, payload);
        } else {
            assert(comp == Comparison.Subset);
            return _subset(data, parameter, payload);
        }
    }

    function _oneOf(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Tracking[] memory toBeTracked) {
        for (uint256 i; i < parameter.children.length; ++i) {
            (status, toBeTracked) = _walk(data, parameter.children[i], payload);
            if (status == Status.Ok) {
                return (status, toBeTracked);
            }
        }
        return (Status.ParameterNotOneOfAllowed, _track());
    }

    function _matches(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Tracking[] memory toBeTracked) {
        if (parameter.children.length != payload.children.length) {
            return (Status.ParameterNotAMatch, _track());
        }

        for (uint256 i; i < parameter.children.length; ++i) {
            (Status status, Tracking[] memory moreToBeTracked) = _walk(
                data,
                parameter.children[i],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return (Status.ParameterNotAMatch, _track());
            }
            toBeTracked = moreToBeTracked.length == 0
                ? toBeTracked
                : _trackMerge(toBeTracked, moreToBeTracked);
        }

        return (Status.Ok, toBeTracked);
    }

    function _every(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Tracking[] memory tobeTracked) {
        for (uint256 i; i < payload.children.length; ++i) {
            (Status status, Tracking[] memory moreToBeTracked) = _walk(
                data,
                parameter.children[0],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return (Status.ArrayElementsNotAllowed, _track());
            }
            tobeTracked = moreToBeTracked.length == 0
                ? tobeTracked
                : _trackMerge(tobeTracked, moreToBeTracked);
        }
        return (Status.Ok, tobeTracked);
    }

    function _some(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Tracking[] memory toBeTracked) {
        for (uint256 i; i < payload.children.length; ++i) {
            (status, toBeTracked) = _walk(
                data,
                parameter.children[0],
                payload.children[i]
            );
            if (status == Status.Ok) {
                return (status, toBeTracked);
            }
        }
        return (Status.ArrayElementsSomeNotAllowed, _track());
    }

    function _subset(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status, Tracking[] memory toBeTracked) {
        ParameterPayload[] memory values = payload.children;
        if (values.length == 0) {
            return (Status.ParameterNotSubsetOfAllowed, _track());
        }
        ParameterConfig[] memory compValues = parameter.children;

        uint256 taken;
        for (uint256 i; i < values.length; ++i) {
            bool found = false;
            for (uint256 j; j < compValues.length; ++j) {
                if (taken & (1 << j) != 0) continue;

                (Status status, Tracking[] memory moreToBeTracked) = _walk(
                    data,
                    compValues[j],
                    values[i]
                );
                if (status == Status.Ok) {
                    found = true;
                    taken |= 1 << j;
                    toBeTracked = moreToBeTracked.length == 0
                        ? toBeTracked
                        : _trackMerge(toBeTracked, moreToBeTracked);
                    break;
                }
            }
            if (!found) {
                return (Status.ParameterNotSubsetOfAllowed, _track());
            }
        }
        return (Status.Ok, toBeTracked);
    }

    function _withinLimit(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Tracking[] memory) {
        assert(parameter._type == ParameterType.Static);

        uint256 amount = uint256(_pluck(data, parameter._type, payload));
        if (amount > parameter.allowance) {
            return (Status.AllowanceExceeded, _track());
        }

        return (
            Status.Ok,
            _track(Tracking({config: parameter, payload: payload}))
        );
    }

    function _compare(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status status, Tracking[] memory) {
        assert(
            parameter.comp == Comparison.EqualTo ||
                parameter.comp == Comparison.GreaterThan ||
                parameter.comp == Comparison.LessThan
        );

        Comparison comp = parameter.comp;
        bytes32 compValue = parameter.compValue;
        bytes32 value = _pluck(data, parameter._type, payload);

        if (comp == Comparison.EqualTo && value != compValue) {
            status = Status.ParameterNotAllowed;
        } else if (comp == Comparison.GreaterThan && value <= compValue) {
            status = Status.ParameterLessThanAllowed;
        } else if (comp == Comparison.LessThan && value >= compValue) {
            status = Status.ParameterGreaterThanAllowed;
        } else {
            status = Status.Ok;
        }

        return (status, _track());
    }

    function _pluck(
        bytes calldata data,
        ParameterType paramType,
        ParameterPayload memory payload
    ) private pure returns (bytes32) {
        if (payload.size != payload.raw.length) {
            payload.raw = Decoder.pluck(data, payload.location, payload.size);
        }

        if (paramType == ParameterType.Static) {
            return bytes32(payload.raw);
        } else {
            return keccak256(payload.raw);
        }
    }

    function _track() private pure returns (Tracking[] memory result) {
        return result;
    }

    function _track(
        Tracking memory tracking
    ) private pure returns (Tracking[] memory result) {
        result = new Tracking[](1);
        result[0] = tracking;
    }

    function _trackMerge(
        Tracking[] memory t1,
        Tracking[] memory t2
    ) private pure returns (Tracking[] memory result) {
        if (t1.length == 0) return t2;
        if (t2.length == 0) return t1;

        result = new Tracking[](t1.length + t2.length);

        uint i;
        for (i; i < t1.length; ++i) {
            result[i] = t1[i];
        }

        for (uint256 j; j < t2.length; ++j) {
            result[i++] = t2[j];
        }
    }

    function revertWith(Status status) public pure returns (bool) {
        assert(status != Status.Ok);

        if (status == Status.FunctionSignatureTooShort) {
            revert FunctionSignatureTooShort();
        } else if (status == Status.DelegateCallNotAllowed) {
            revert DelegateCallNotAllowed();
        } else if (status == Status.TargetAddressNotAllowed) {
            revert TargetAddressNotAllowed();
        } else if (status == Status.FunctionNotAllowed) {
            revert FunctionNotAllowed();
        } else if (status == Status.FunctionVariantNotAllowed) {
            revert FunctionVariantNotAllowed();
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
        } else {
            assert(status == Status.AllowanceExceeded);
            revert AllowanceExceeded();
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
        FunctionVariantNotAllowed,
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
        AllowanceDoubleSpend
    }
}
