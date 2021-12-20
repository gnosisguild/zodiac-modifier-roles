// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "./Roles.sol";
import "./Comp.sol";
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

struct Parameter {
    mapping(bytes => bool) allowed;
    bytes compValue;
}

struct Function {
    bool allowed;
    bool scoped;
    bool[] paramsScoped;
    bool[] paramTypes;
    mapping(uint16 => Parameter) values;
    Comp.Comparison[] compTypes;
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

struct RoleWrap {
    mapping(uint16 => Role) roles;
}

library TransactionCheck {
    event SetParameterAllowedValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 parameterIndex,
        bytes value,
        bool allowed
    );
    event SetFunctionAllowedOnTargetAddress(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        bool allowed
    );
    event SetParametersScoped(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool scoped,
        bool[] paramsScoped,
        bool[] types,
        Comp.Comparison[] compTypes
    );

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

    /// @dev Splits a multisend data blob into transactions and forwards them to be checked.
    /// @param data the packed transaction data (created by utils function buildMultiSendSafeTx).
    /// @param role Role to check for.
    function checkMultiSend(
        RoleWrap storage self,
        bytes memory data,
        uint16 role
    ) public view {
        Enum.Operation operation;
        address to;
        uint256 value;
        bytes memory out;
        uint256 dataLength;
        // transaction data begins at byte 100, increment i by the transaction data length
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

    function checkParameter(
        RoleWrap storage self,
        address targetAddress,
        uint16 role,
        bytes memory data,
        uint16 paramIndex,
        bytes memory value
    ) public view {
        bytes4 functionSig = bytes4(data);
        bytes memory compValue = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .compValue;
        Comp.Comparison compType = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .compTypes[paramIndex];
        if (
            compType == Comp.Comparison.EqualTo &&
            !isAllowedValueForParam(
                self,
                role,
                targetAddress,
                functionSig,
                paramIndex,
                value
            )
        ) {
            revert ParameterNotAllowed();
        } else if (
            compType == Comp.Comparison.GreaterThan &&
            bytes32(value) <= bytes32(compValue)
        ) {
            revert ParameterLessThanAllowed();
        } else if (
            compType == Comp.Comparison.LessThan &&
            bytes32(value) >= bytes32(compValue)
        ) {
            revert ParameterGreaterThanAllowed();
        }
    }

    /// @dev Will revert if a transaction has a parameter that is not allowed
    /// @param self reference to roles storage
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    /// @param data the transaction data to check
    function checkParameters(
        RoleWrap storage self,
        uint16 role,
        address targetAddress,
        bytes memory data
    ) public view {
        bytes4 functionSig = bytes4(data);
        // First 4 bytes are the function selector, skip function selector.
        uint16 pos = 4;
        bool[] memory paramTypes = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramTypes;
        bool isScopedParam = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .scoped;
        // (bool isScopedParam, bool[] memory paramTypes, , ) = Roles(
        //     address(this)
        // ).getParameterScopes(role, targetAddress, functionSig);
        for (
            // loop through each parameter
            uint16 i = 0;
            i < paramTypes.length;
            i++
        ) {
            if (isScopedParam) {
                // we set paramType to true if its a fixed or dynamic array type with length encoding
                if (paramTypes[i] == true) {
                    // location of length of first parameter is first word (4 bytes)
                    pos += 32;
                    uint256 lengthLocation;
                    assembly {
                        lengthLocation := mload(add(data, pos))
                    }
                    // get location of length prefix, always start from param block start (4 bytes + 32 bytes)
                    uint256 lengthPos = 36 + lengthLocation;
                    // get the data at length position
                    bytes memory out;
                    assembly {
                        out := add(data, lengthPos)
                    }
                    checkParameter(self, targetAddress, role, data, i, out);

                    // the parameter is not an array and has no length encoding
                } else {
                    // fixed value data is positioned within the parameter block
                    pos += 32;
                    bytes32 decoded;
                    assembly {
                        decoded := mload(add(data, pos))
                    }
                    // encode bytes32 to bytes memory for the mapping key
                    bytes memory encoded = abi.encodePacked(decoded);
                    checkParameter(self, targetAddress, role, data, i, encoded);
                }
            }
        }
    }

    function checkTransaction(
        RoleWrap storage self,
        address targetAddress,
        uint256,
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
        } else {
            if (bools[4] && !bools[2]) {
                revert SendNotAllowed();
            }
        }
    }

    /// @dev Returns bool to indicate if a value is allowed for a parameter on a function at a target address for a role.
    /// @param role Role to check.
    /// @param targetAddress Address to check.
    /// @param functionSig Function signature to check.
    /// @param paramIndex Parameter index to check.
    /// @param value Value to check.
    function isAllowedValueForParam(
        RoleWrap storage self,
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 paramIndex,
        bytes memory value
    ) public view returns (bool) {
        bool compAllowed = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .allowed[value];

        bytes memory compValue = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .compValue;

        Comp.Comparison comptype = self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .compTypes[paramIndex];
        if (comptype == Comp.Comparison.EqualTo) {
            return compAllowed;
        } else if (comptype == Comp.Comparison.GreaterThan) {
            if (bytes32(value) > bytes32(compValue)) {
                return true;
            } else {
                return false;
            }
        } else if (comptype == Comp.Comparison.LessThan) {
            if (bytes32(value) < bytes32(compValue)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    function setParameterAllowedValue(
        RoleWrap storage self,
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 paramIndex,
        bytes memory value,
        bool allow
    ) external {
        // todo: require that param is scoped first?
        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .allowed[value] = allow;

        emit SetParameterAllowedValue(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            value,
            allow
        );
    }

    function setAllowedFunction(
        RoleWrap storage self,
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
        emit SetFunctionAllowedOnTargetAddress(
            role,
            targetAddress,
            functionSig,
            allow
        );
    }

    /// @dev Sets whether or not calls should be scoped to specific parameter value or range of values.
    /// @notice Only callable by owner.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    /// @param paramsScoped false for un-scoped, true for scoped.
    /// @param types false for static, true for dynamic.
    /// @param compTypes Any, or EqualTo, GreaterThan, or LessThan compValue.
    function setParametersScoped(
        RoleWrap storage self,
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool scoped,
        bool[] memory paramsScoped,
        bool[] memory types,
        Comp.Comparison[] memory compTypes
    ) external {
        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .scoped = scoped;
        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramTypes = types;
        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramsScoped = paramsScoped;
        self
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .compTypes = compTypes;
        emit SetParametersScoped(
            role,
            targetAddress,
            functionSig,
            scoped,
            paramsScoped,
            types,
            compTypes
        );
    }
}
