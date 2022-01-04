// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "./Roles.sol";
import "./Comp.sol";
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

struct Parameter {
    mapping(bytes32 => bool) allowed;
    bytes32 compValue;
}

struct Function {
    bool allowed;
    bool scoped;
    uint256 paramConfig;
    mapping(uint16 => Parameter) values;
}

struct TargetAddress {
    bool allowed;
    bool scoped;
    bool delegateCallAllowed;
    bool sendAllowed;
    mapping(bytes4 => Function) functions;
}

struct Role {
    mapping(address => TargetAddress) targetAddresses;
    mapping(address => bool) members;
}

struct RoleList {
    mapping(uint16 => Role) roles;
}

library Permissions {
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

    /// Role not allowed to use bytes less than value for parameter
    error ParameterLessThanAllowed();

    /// Role not allowed to use bytes greater than value for parameter
    error ParameterGreaterThanAllowed();

    // only multisend txs with an offset of 32 bytes are allowed
    error UnacceptableMultiSendOffset();

    /// @dev Splits a multisend data blob into transactions and forwards them to be checked.
    /// @param data the packed transaction data (created by utils function buildMultiSendSafeTx).
    /// @param role Role to check for.
    function checkMultiSend(
        RoleList storage self,
        bytes memory data,
        uint16 role
    ) public view {
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
            checkTransaction(self, to, value, out, operation, role);
        }
    }

    /// @dev Will revert if a transaction has a parameter that is not allowed
    /// @param self reference to roles storage
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    /// @param data the transaction data to check
    function checkParameters(
        RoleList storage self,
        uint16 role,
        address targetAddress,
        bytes memory data
    ) public view {
        bytes4 functionSig = bytes4(data);
        bool isFunctionScoped = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .scoped;

        if (!isFunctionScoped) {
            return;
        }

        uint256 paramConfig = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramConfig;

        uint8 paramCount = unpackParamCount(paramConfig);

        for (uint8 i = 0; i < paramCount; i++) {
            (
                bool isParamScoped,
                bool isParamDynamic,
                Comp.Comparison compType
            ) = unpackParamConfig(paramConfig, i);

            bytes32 compValue;
            bool isAllowed;
            bytes32 value;

            if (!isParamScoped) {
                continue;
            }

            if (isParamDynamic) {
                value = pluckDynamicParamValue(data, i);
                compType = Comp.Comparison.EqualTo;
            } else {
                value = pluckParamValue(data, i);
            }

            if (compType == Comp.Comparison.EqualTo) {
                isAllowed = self
                    .roles[role]
                    .targetAddresses[targetAddress]
                    .functions[functionSig]
                    .values[i]
                    .allowed[value];
            } else {
                compValue = self
                    .roles[role]
                    .targetAddresses[targetAddress]
                    .functions[functionSig]
                    .values[i]
                    .compValue;
            }

            compareParameterValues(compType, compValue, isAllowed, value);
        }
    }

    function compareParameterValues(
        Comp.Comparison compType,
        bytes32 compValue,
        bool isAllowed,
        bytes32 value
    ) internal pure {
        if (compType == Comp.Comparison.EqualTo && !isAllowed) {
            revert ParameterNotAllowed();
        } else if (
            compType == Comp.Comparison.GreaterThan && value <= compValue
        ) {
            revert ParameterLessThanAllowed();
        } else if (compType == Comp.Comparison.LessThan && value >= compValue) {
            revert ParameterGreaterThanAllowed();
        }
    }

    function pluckDynamicParamValue(bytes memory data, uint256 paramIndex)
        internal
        pure
        returns (bytes32)
    {
        // get the pointer to the start of the buffer
        uint256 offset = 32 + 4 + paramIndex * 32;
        uint256 start;
        assembly {
            start := add(32, add(4, mload(add(data, offset))))
        }

        uint256 length;
        assembly {
            length := mload(add(data, start))
        }

        if (length > 32) {
            return keccak256(slice(data, start, start + length));
        } else {
            bytes32 content;
            assembly {
                content := mload(add(add(data, start), 32))
            }
            return content;
        }
    }

    function pluckParamValue(bytes memory data, uint256 paramIndex)
        internal
        pure
        returns (bytes32)
    {
        uint256 offset = 32 + 4 + paramIndex * 32;
        bytes32 value;
        assembly {
            value := mload(add(data, offset))
        }
        return value;
    }

    function slice(
        bytes memory data,
        uint256 start,
        uint256 end
    ) internal pure returns (bytes memory result) {
        result = new bytes(end - start);
        uint256 i;
        for (uint256 j = start; j < end; j++) {
            result[i++] = data[j];
        }
    }

    function checkTransaction(
        RoleList storage self,
        address targetAddress,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint16 role
    ) public view {
        bytes4 functionSig = bytes4(data);
        // bools[0] = targetAllowed
        // bools[1] = targetScoped
        // bools[2] = sendAllowed
        // bools[3] = functionAllowed
        // bools[4] = functionscoped
        // bools[5] = delegateAllowed
        bool[6] memory bools;
        bools[0] = self.roles[role].targetAddresses[targetAddress].allowed;
        bools[1] = self.roles[role].targetAddresses[targetAddress].scoped;
        bools[2] = self.roles[role].targetAddresses[targetAddress].sendAllowed;
        bools[3] = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .allowed;
        bools[4] = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .scoped;
        bools[5] = self
            .roles[role]
            .targetAddresses[targetAddress]
            .delegateCallAllowed;
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }
        if (operation == Enum.Operation.DelegateCall && !bools[5]) {
            revert DelegateCallNotAllowed();
        }
        if (!bools[0]) {
            revert TargetAddressNotAllowed();
        }
        if (data.length >= 4) {
            if (bools[1] && !bools[3]) {
                revert FunctionNotAllowed();
            }
            if (bools[4]) {
                checkParameters(self, role, targetAddress, data);
            }
        }

        if (value > 0 && !bools[2]) {
            revert SendNotAllowed();
        }
    }

    function setAllowedFunction(
        RoleList storage self,
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool allow
    ) external {
        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .allowed = allow;
    }

    /// @dev Sets whether or not calls should be scoped to specific parameter value or range of values.
    /// @notice Only callable by owner.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    /// @param isParamScoped false for un-scoped, true for scoped.
    /// @param isParamDynamic false for static, true for dynamic.
    /// @param paramCompType Any, or EqualTo, GreaterThan, or LessThan compValue.
    function setParametersScoped(
        RoleList storage self,
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool scoped,
        bool[] memory isParamScoped,
        bool[] memory isParamDynamic,
        Comp.Comparison[] memory paramCompType
    ) external {
        require(
            isParamScoped.length <= 62,
            "Functions with more than 62 arguments are not supported"
        );

        require(
            isParamScoped.length == isParamDynamic.length,
            "Mismatch: isParamScoped and isParamDynamic arrays have different lengths"
        );

        require(
            isParamScoped.length == paramCompType.length,
            "Mismatch: isParamScoped and paramCompType arrays have different lengths"
        );

        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .scoped = scoped;

        uint8 paramCount = uint8(isParamScoped.length);
        uint256 paramConfig = packParamCount(paramCount);
        for (uint8 i = 0; i < paramCount; i++) {
            paramConfig = packParamConfig(
                paramConfig,
                i,
                isParamScoped[i],
                isParamDynamic[i],
                paramCompType[i]
            );
        }

        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramConfig = paramConfig;
    }

    function packParamConfig(
        uint256 config,
        uint8 paramIndex,
        bool isScoped,
        bool isDynamic,
        Comp.Comparison compType
    ) internal pure returns (uint256) {
        // we restrict paramCount to 62:
        // 8   bits -> length
        // 62  bits -> isParamScoped
        // 62  bits -> isParamDynamic
        // 124 bits -> two bits for each compType 62*2 = 124
        if (isScoped) {
            config |= 1 << (paramIndex + 62 + 124);
            config |= uint256(compType) << (paramIndex * 2);
        }

        if (isDynamic) {
            config |= 1 << (paramIndex + 124);
        }
        return config;
    }

    function unpackParamConfig(uint256 config, uint8 paramIndex)
        internal
        pure
        returns (
            bool isScoped,
            bool isDynamic,
            Comp.Comparison compType
        )
    {
        uint256 isScopedMask = 1 << (paramIndex + 62 + 124);
        uint256 isDynamicMask = 1 << (paramIndex + 124);
        // 3 -> 11 in binary
        uint256 compTypeMask = 3 << (2 * paramIndex);

        isScoped = (config & isScopedMask) != 0;
        isDynamic = (config & isDynamicMask) != 0;
        compType = Comp.Comparison((config & compTypeMask) >> (2 * paramIndex));
    }

    function packParamCount(uint8 paramCount) internal pure returns (uint256) {
        // 8   bits -> length
        // 62  bits -> isParamScoped
        // 62  bits -> isParamDynamic
        // 124 bits -> two bits represents for each compType 62*2 = 124
        return (uint256(paramCount) << (62 + 62 + 124));
    }

    function unpackParamCount(uint256 config) internal pure returns (uint8) {
        return uint8(config >> 248);
    }
}
