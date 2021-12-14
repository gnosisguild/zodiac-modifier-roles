// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "./Roles.sol";
import "./Comp.sol";
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

library TransactionCheck {
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
    /// @param transactions the packed transaction data (created by utils function buildMultiSendSafeTx).
    /// @param role Role to check for.
    function checkMultiSend(bytes memory transactions, uint16 role)
        public
        view
    {
        Enum.Operation operation;
        address to;
        uint256 value;
        bytes memory data;
        uint256 dataLength;
        // transaction data begins at byte 100, increment i by the transaction data length
        // + 85 bytes of the to, value, and operation bytes until we reach the end of the data
        for (uint256 i = 100; i < transactions.length; i += (85 + dataLength)) {
            assembly {
                // First byte of the data is the operation.
                // We shift by 248 bits (256 - 8 [operation byte]) right since mload will always load 32 bytes (a word).
                // This will also zero out unused data.
                operation := shr(0xf8, mload(add(transactions, i)))
                // We offset the load address by 1 byte (operation byte)
                // We shift it right by 96 bits (256 - 160 [20 address bytes]) to right-align the data and zero out unused data.
                to := shr(0x60, mload(add(transactions, add(i, 0x01))))
                // We offset the load address by 21 byte (operation byte + 20 address bytes)
                value := mload(add(transactions, add(i, 0x15)))
                // We offset the load address by 53 byte (operation byte + 20 address bytes + 32 value bytes)
                dataLength := mload(add(transactions, add(i, 0x35)))
                // We offset the load address by 85 byte (operation byte + 20 address bytes + 32 value bytes + 32 data length bytes)
                data := add(transactions, add(i, 0x35))
            }
            checkTransaction(to, value, data, operation, role);
        }
    }

    function checkParameter(
        address targetAddress,
        uint16 role,
        bytes memory data,
        uint16 paramIndex,
        bytes memory value
    ) public view {
        bytes4 functionSig = bytes4(data);
        if (
            Roles(msg.sender).getCompType(
                role,
                targetAddress,
                functionSig,
                paramIndex
            ) ==
            Comp.Comparison.EqualTo &&
            !Roles(msg.sender).isAllowedValueForParam(
                role,
                targetAddress,
                functionSig,
                paramIndex,
                value
            )
        ) {
            revert ParameterNotAllowed();
        } else if (
            Roles(msg.sender).getCompType(
                role,
                targetAddress,
                functionSig,
                paramIndex
            ) ==
            Comp.Comparison.GreaterThan &&
            bytes32(value) <=
            bytes32(
                Roles(msg.sender).getCompValue(
                    role,
                    targetAddress,
                    functionSig,
                    paramIndex
                )
            )
        ) {
            revert ParameterLessThanAllowed();
        } else if (
            Roles(msg.sender).getCompType(
                role,
                targetAddress,
                functionSig,
                paramIndex
            ) ==
            Comp.Comparison.LessThan &&
            bytes32(value) >=
            bytes32(
                Roles(msg.sender).getCompValue(
                    role,
                    targetAddress,
                    functionSig,
                    paramIndex
                )
            )
        ) {
            revert ParameterGreaterThanAllowed();
        }
    }

    /// @dev Will revert if a transaction has a parameter that is not allowed
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    /// @param data the transaction data to check
    function checkParameters(
        uint16 role,
        address targetAddress,
        bytes memory data
    ) public view {
        bytes4 functionSig = bytes4(data);
        // First 4 bytes are the function selector, skip function selector.
        uint16 pos = 4;
        (, bool[] memory paramTypes, , ) = Roles(msg.sender).getParameterScopes(
            role,
            targetAddress,
            functionSig
        );
        for (
            // loop through each parameter
            uint16 i = 0;
            i < paramTypes.length;
            i++
        ) {
            (bool isScopedParam, bool[] memory paramTypes, , ) = Roles(
                msg.sender
            ).getParameterScopes(role, targetAddress, functionSig);
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
                    uint256 length;
                    assembly {
                        // load the first parameter length at (4 bytes + 32 bytes + lengthLocation bytes)
                        length := mload(add(data, lengthPos))
                    }
                    // get the data at length position
                    bytes memory out;
                    assembly {
                        out := add(data, lengthPos)
                    }
                    checkParameter(targetAddress, role, data, i, out);

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
                    checkParameter(targetAddress, role, data, i, encoded);
                }
            }
        }
    }

    function checkTransaction(
        address targetAddress,
        uint256,
        bytes memory data,
        Enum.Operation operation,
        uint16 role
    ) public view {
        bytes4 functionSig = bytes4(data);
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }
        if (
            operation == Enum.Operation.DelegateCall &&
            !Roles(msg.sender).isAllowedToDelegateCall(role, targetAddress)
        ) {
            revert DelegateCallNotAllowed();
        }
        if (!Roles(msg.sender).isAllowedTargetAddress(role, targetAddress)) {
            revert TargetAddressNotAllowed();
        }
        if (data.length >= 4) {
            if (
                Roles(msg.sender).isScoped(role, targetAddress) &&
                !Roles(msg.sender).isAllowedFunction(
                    role,
                    targetAddress,
                    functionSig
                )
            ) {
                revert FunctionNotAllowed();
            }
            if (
                Roles(msg.sender).isFunctionScoped(
                    role,
                    targetAddress,
                    functionSig
                )
            ) {
                checkParameters(role, targetAddress, data);
            }
        } else {
            if (
                Roles(msg.sender).isFunctionScoped(
                    role,
                    targetAddress,
                    functionSig
                ) && !Roles(msg.sender).isSendAllowed(role, targetAddress)
            ) {
                revert SendNotAllowed();
            }
        }
    }
}
