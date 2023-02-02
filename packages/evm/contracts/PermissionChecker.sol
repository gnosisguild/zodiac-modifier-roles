// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "./Types.sol";

import "./Decoder.sol";
import "./ScopeConfig.sol";
import "./PermissionBuilder.sol";

abstract contract PermissionChecker is PermissionBuilder {
    /// Sender is not a member of the role
    error NoMembership();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Role not allowed to delegate call to target address
    error DelegateCallNotAllowed();

    /// Role not allowed to call target address
    error TargetAddressNotAllowed();

    /// Role not allowed to call this function on target address
    error FunctionNotAllowed();
    error FunctionVariantNotAllowed();

    /// Role not allowed to send to target address
    error SendNotAllowed();

    /// Role not allowed to use bytes for parameter
    error ParameterNotAllowed();

    /// Role not allowed to use bytes for parameter
    error ParameterNotOneOfAllowed();

    error ParameterNotSubsetOfAllowed();

    /// Role not allowed to use bytes less than value for parameter
    error ParameterLessThanAllowed();

    /// Role not allowed to use bytes greater than value for parameter
    error ParameterGreaterThanAllowed();

    error ArrayMatchesNotSameLength();

    /// only multisend txs with an offset of 32 bytes are allowed
    error UnacceptableMultiSendOffset();

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
    ) internal view {
        if (!roles[roleId].members[msg.sender]) {
            revert NoMembership();
        }

        Status status = checkTransaction(roleId, to, value, data, operation);
        // if (multisend == to) {
        //     status = checkMultisendTransaction(roleId, data);
        // } else {
        //     status = checkTransaction(roleId, to, value, data, operation);
        // }
        if (status != Status.Ok) {
            revertWith(status);
        }
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
    ) internal view returns (Status) {
        if (data.length != 0 && data.length < 4) {
            return Status.FunctionSignatureTooShort;
        }

        TargetAddress storage target = roles[roleId].targets[targetAddress];

        if (target.clearance == Clearance.Target) {
            return _checkExecutionOptions(value, operation, target.options);
        } else if (target.clearance == Clearance.Function) {
            Role storage role = roles[roleId];

            BitmapBuffer memory buffer = ScopeConfig.load(
                role.functions[_key(targetAddress, bytes4(data))]
            );

            if (buffer.payload[0] == 0) {
                return Status.FunctionNotAllowed;
            }

            (, bool isWildcarded, ExecutionOptions options) = ScopeConfig
                .unpackHeader(buffer);

            Status status = _checkExecutionOptions(value, operation, options);
            if (status != Status.Ok) {
                return status;
            }

            if (isWildcarded) {
                return Status.Ok;
            }

            return _checkFunction(role, targetAddress, data, buffer);
        } else {
            return Status.TargetAddressNotAllowed;
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

    function _checkFunction(
        Role storage role,
        address targetAddress,
        bytes calldata data,
        BitmapBuffer memory scopeConfig
    ) internal view returns (Status) {
        ParameterConfig[] memory parameters = _loadParameterConfig(
            targetAddress,
            bytes4(data),
            role,
            scopeConfig
        );

        ParameterPayload[] memory payloads = Decoder.inspect(
            data,
            Topology.typeTree(parameters)
        );

        if (Topology.isVariantEntrypoint(parameters)) {
            return
                _checkFunctionVariants(data, parameters[0].children, payloads);
        } else if (Topology.isExplicitEntrypoint(parameters)) {
            return _checkFunction(data, parameters[0].children, payloads);
        } else {
            // is implicit
            return _checkFunction(data, parameters, payloads);
        }
    }

    function _checkFunctionVariants(
        bytes calldata data,
        ParameterConfig[] memory variants,
        ParameterPayload[] memory payloads
    ) internal view returns (Status) {
        for (uint256 i; i < variants.length; ++i) {
            Status status = _checkFunction(
                data,
                variants[i].children,
                payloads
            );
            if (status == Status.Ok) {
                return status;
            }
        }
        return Status.FunctionVariantNotAllowed;
    }

    function _checkFunction(
        bytes calldata data,
        ParameterConfig[] memory parameters,
        ParameterPayload[] memory payloads
    ) internal view returns (Status) {
        assert(parameters.length == payloads.length);

        for (uint256 i; i < parameters.length; ++i) {
            Status status = _checkParameter(data, parameters[i], payloads[i]);
            if (status != Status.Ok) {
                return status;
            }
        }
        return Status.Ok;
    }

    function _checkParameter(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) internal view returns (Status) {
        assert(parameter._type != ParameterType.Function);

        if (!parameter.isScoped) {
            return Status.Ok;
        }

        if (parameter._type == ParameterType.Array) {
            return _checkArray(data, parameter, payload);
        } else if (parameter._type == ParameterType.Tuple) {
            return _checkTuple(data, parameter, payload);
        } else if (parameter._type == ParameterType.OneOf) {
            return _checkOneOf(data, parameter, payload);
        } else {
            return _compare(data, parameter, payload);
        }
    }

    function _checkOneOf(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private view returns (Status status) {
        for (uint256 i; i < parameter.children.length; ++i) {
            if (
                _checkParameter(data, parameter.children[i], payload) ==
                Status.Ok
            ) {
                return status;
            }
        }

        return Status.ParameterNotOneOfAllowed;
    }

    function _checkArray(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private view returns (Status status) {
        Comparison comp = parameter.comp;
        bool isMatches = comp == Comparison.Matches;
        bool isEvery = comp == Comparison.Every;
        bool isSome = comp == Comparison.Some;

        if (isMatches && parameter.children.length != payload.children.length) {
            return Status.ArrayMatchesNotSameLength;
        }

        for (uint256 i; i < payload.children.length; ++i) {
            status = _checkParameter(
                data,
                parameter.children[isMatches ? i : 0],
                payload.children[i]
            );

            bool isOk = status == Status.Ok;
            if (((isEvery || isMatches) && !isOk) || (isSome && isOk)) {
                return status;
            }
        }

        // TODO create new custom errors
        return isSome ? Status.ParameterNotAllowed : Status.Ok;
    }

    function _checkTuple(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private view returns (Status status) {
        for (uint256 i; i < parameter.children.length; ++i) {
            status = _checkParameter(
                data,
                parameter.children[i],
                payload.children[i]
            );
            if (status != Status.Ok) {
                return status;
            }
        }
        return Status.Ok;
    }

    function _compare(
        bytes calldata data,
        ParameterConfig memory parameter,
        ParameterPayload memory payload
    ) private pure returns (Status) {
        assert(
            parameter.comp == Comparison.EqualTo ||
                parameter.comp == Comparison.GreaterThan ||
                parameter.comp == Comparison.LessThan
        );

        Comparison comp = parameter.comp;
        bytes32 compValue = parameter.compValue;
        bytes32 value = _compressValue(data, parameter._type, payload);

        if (comp == Comparison.EqualTo && value != compValue) {
            return Status.ParameterNotAllowed;
        } else if (comp == Comparison.GreaterThan && value <= compValue) {
            return Status.ParameterLessThanAllowed;
        } else if (comp == Comparison.LessThan && value >= compValue) {
            return Status.ParameterGreaterThanAllowed;
        }
        return Status.Ok;
    }

    function _compressValue(
        bytes calldata data,
        ParameterType paramType,
        ParameterPayload memory payload
    ) private pure returns (bytes32) {
        if (payload.size != payload.raw.length) {
            payload.raw = Decoder.pluck(data, payload.offset, payload.size);
        }

        if (paramType == ParameterType.Static) {
            return bytes32(payload.raw);
        } else {
            assert(paramType == ParameterType.Dynamic);
            return keccak256(payload.raw);
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
        } else if (status == Status.ParameterNotOneOfAllowed) {
            revert ParameterNotOneOfAllowed();
        } else if (status == Status.ParameterNotSubsetOfAllowed) {
            revert ParameterNotSubsetOfAllowed();
        } else if (status == Status.ParameterLessThanAllowed) {
            revert ParameterLessThanAllowed();
        } else if (status == Status.ParameterGreaterThanAllowed) {
            revert ParameterGreaterThanAllowed();
        } else if (status == Status.ArrayMatchesNotSameLength) {
            revert ArrayMatchesNotSameLength();
        } else {
            assert(status == Status.UnacceptableMultiSendOffset);
            revert UnacceptableMultiSendOffset();
        }
    }

    enum Status {
        Ok,
        FunctionSignatureTooShort,
        /// only multisend txs with an offset of 32 bytes are allowed
        UnacceptableMultiSendOffset,
        /// Role not allowed to delegate call to target address
        DelegateCallNotAllowed,
        /// Role not allowed to call target address
        TargetAddressNotAllowed,
        /// Role not allowed to call this function on target address
        FunctionNotAllowed,
        FunctionVariantNotAllowed,
        /// Role not allowed to send to target address
        SendNotAllowed,
        /// Role not allowed to use bytes for parameter
        ParameterNotAllowed,
        /// Role not allowed to use bytes for parameter
        ParameterNotOneOfAllowed,
        ParameterNotSubsetOfAllowed,
        /// Role not allowed to use bytes less than value for parameter
        ParameterLessThanAllowed,
        /// Role not allowed to use bytes greater than value for parameter
        ParameterGreaterThanAllowed,
        ArrayMatchesNotSameLength
    }
}

//  function _compareSubsetOf(
//         bytes32[] memory compValues,
//         bytes32[] memory value
//     ) private pure returns (Status) {
//         if (value.length == 0) {
//             return Status.ParameterNotSubsetOfAllowed;
//         }

//         uint256 taken;
//         for (uint256 i; i < value.length; ++i) {
//             for (uint256 j; j <= compValues.length; ++j) {
//                 if (j == compValues.length) {
//                     return Status.ParameterNotSubsetOfAllowed;
//                 }
//                 uint256 mask = 1 << j;
//                 if ((taken & mask) == 0 && value[i] == compValues[j]) {
//                     taken |= mask;
//                     break;
//                 }
//             }
//         }
//         return Status.Ok;
//     }
