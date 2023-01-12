// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "./Types.sol";

import "./ScopeConfig.sol";
import "./PluckCalldata.sol";
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
        if (multisend == to) {
            checkMultisendTransaction(roleId, data);
        } else {
            checkTransaction(roleId, to, value, data, operation);
        }
    }

    /// @dev Splits a multisend data blob into transactions and forwards them to be checked.
    /// @param data the packed transaction data (created by utils function buildMultiSendSafeTx).
    function checkMultisendTransaction(
        uint16 roleId,
        bytes memory data
    ) internal view {
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
            checkTransaction(roleId, to, value, out, operation);
        }
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
        bytes memory data,
        Enum.Operation operation
    ) internal view {
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        TargetAddress storage target = roles[roleId].targets[targetAddress];

        if (target.clearance == Clearance.Target) {
            checkExecutionOptions(value, operation, target.options);
        } else if (target.clearance == Clearance.Function) {
            Role storage role = roles[roleId];
            uint256 scopeConfig = role.functions[
                _key(targetAddress, bytes4(data))
            ];

            if (scopeConfig == 0) {
                revert FunctionNotAllowed();
            }

            (ExecutionOptions options, bool isWildcarded, ) = ScopeConfig
                .unpack(scopeConfig);

            checkExecutionOptions(value, operation, options);

            if (!isWildcarded) {
                checkParameters(role, targetAddress, data);
            }
        } else {
            assert(target.clearance == Clearance.None);
            revert TargetAddressNotAllowed();
        }
    }

    /// @dev Examines the ether value and operation for a given role target.
    /// @param value Ether value of module transaction.
    /// @param operation Operation type of module transaction: 0 == call, 1 == delegate call.
    /// @param options Determines if a transaction can send ether and/or delegatecall to target.
    function checkExecutionOptions(
        uint256 value,
        Enum.Operation operation,
        ExecutionOptions options
    ) internal pure {
        // isSend && !canSend
        if (
            value > 0 &&
            options != ExecutionOptions.Send &&
            options != ExecutionOptions.Both
        ) {
            revert SendNotAllowed();
        }

        // isDelegateCall && !canDelegateCall
        if (
            operation == Enum.Operation.DelegateCall &&
            options != ExecutionOptions.DelegateCall &&
            options != ExecutionOptions.Both
        ) {
            revert DelegateCallNotAllowed();
        }
    }

    /// @dev Will revert if a transaction has a parameter that is not allowed
    /// @param data the transaction data to check
    function checkParameters(
        Role storage role,
        address targetAddress,
        bytes memory data
    ) internal view {
        bytes4 selector = bytes4(data);
        bytes memory key = abi.encodePacked(targetAddress, selector);

        ParameterLayout[] memory layout = _loadParameterLayout(role, key);
        ParameterPayload[] memory payload = PluckCalldata.pluck(data, layout);

        for (uint256 i = 0; i < layout.length; ++i) {
            if (layout[i].isScoped) {
                _checkParameter(role, layout[i], payload[i], key, i);
            }
        }
    }

    function _checkParameter(
        Role storage role,
        ParameterLayout memory layout,
        ParameterPayload memory payload,
        bytes memory prefix,
        uint256 index
    ) internal view {
        bytes memory key = abi.encodePacked(prefix, uint8(index));
        if (layout._type == ParameterType.Static) {
            _checkStaticValue(
                role,
                keccak256(key),
                layout.comp,
                payload._static
            );
        } else if (layout._type == ParameterType.Dynamic) {
            _checkDynamicValue(
                role,
                keccak256(key),
                layout.comp,
                payload.dynamic
            );
        } else if (layout._type == ParameterType.Dynamic32) {
            _checkDynamic32Value(
                role,
                keccak256(key),
                layout.comp,
                payload.dynamic32
            );
        }
    }

    function _checkStaticValue(
        Role storage role,
        bytes32 key,
        Comparison paramComp,
        bytes32 value
    ) private view {
        if (paramComp == Comparison.OneOf) {
            _compareOneOf(role.compValues[key], value);
        } else {
            _compare(paramComp, role.compValue[key], value);
        }
    }

    function _checkDynamicValue(
        Role storage role,
        bytes32 key,
        Comparison paramComp,
        bytes memory value
    ) private view {
        if (paramComp == Comparison.OneOf) {
            _compareOneOf(role.compValues[key], keccak256(value));
        } else {
            assert(paramComp != Comparison.SubsetOf);
            _compare(paramComp, role.compValue[key], keccak256(value));
        }
    }

    function _checkDynamic32Value(
        Role storage role,
        bytes32 key,
        Comparison paramComp,
        bytes32[] memory value
    ) private view {
        if (paramComp == Comparison.OneOf) {
            _compareOneOf(
                role.compValues[key],
                keccak256(abi.encodePacked(value))
            );
        } else if (paramComp == Comparison.SubsetOf) {
            _compareSubsetOf(role.compValues[key], value);
        } else {
            _compare(
                paramComp,
                role.compValue[key],
                keccak256(abi.encodePacked(value))
            );
        }
    }

    function _compare(
        Comparison paramComp,
        bytes32 compValue,
        bytes32 value
    ) private pure {
        if (paramComp == Comparison.EqualTo && value != compValue) {
            revert ParameterNotAllowed();
        } else if (paramComp == Comparison.GreaterThan && value <= compValue) {
            revert ParameterLessThanAllowed();
        } else if (paramComp == Comparison.LessThan && value >= compValue) {
            revert ParameterGreaterThanAllowed();
        }
    }

    function _compareOneOf(
        bytes32[] storage compValues,
        bytes32 value
    ) private view {
        for (uint256 i = 0; i < compValues.length; i++) {
            if (compValues[i] == value) return;
        }
        revert ParameterNotOneOfAllowed();
    }

    function _compareSubsetOf(
        bytes32[] storage compValues,
        bytes32[] memory value
    ) private view {
        if (value.length == 0) {
            revert ParameterNotSubsetOfAllowed();
        }

        uint256 taken = 0;
        for (uint256 i = 0; i < value.length; i++) {
            for (uint256 j = 0; j <= compValues.length; j++) {
                if (j == compValues.length) {
                    revert ParameterNotSubsetOfAllowed();
                }
                uint256 mask = 1 << j;
                if ((taken & mask) == 0 && value[i] == compValues[j]) {
                    taken |= mask;
                    break;
                }
            }
        }
    }

    function _loadParameterLayout(
        Role storage role,
        bytes memory key
    ) private view returns (ParameterLayout[] memory result) {
        uint256 scopeConfig = role.functions[keccak256(key)];
        (, , uint256 length) = ScopeConfig.unpack(scopeConfig);

        result = new ParameterLayout[](length);
        for (uint256 i = 0; i < length; i++) {
            (
                bool isScoped,
                ParameterType paramType,
                Comparison paramComp
            ) = ScopeConfig.unpackParameter(scopeConfig, i);
            result[i].isScoped = isScoped;
            result[i]._type = paramType;
            result[i].comp = paramComp;
            if (_isNestedType(paramType)) {
                result[i].nested = _loadParameterLayout(
                    role,
                    abi.encodePacked(key, uint8(i))
                );
            }
        }
    }

    function _isNestedType(ParameterType _type) private pure returns (bool) {
        return _type == ParameterType.Tuple || _type == ParameterType.Array;
    }
}
