// SPDX-License-Identifier: LGPL-3.0
pragma solidity >=0.8.21 <0.9.0;

import "./EIP712Encoder.sol";

import "../interfaces/SafeStorage.sol";

/**
 * @title SignTypedMessageLib - Marks (typed) messages as signed in SafeStorage
 * @author gnosisguild
 */
contract SignTypedMessageLib is SafeStorage {
    /// @dev Deployment address of the contract.
    address public immutable deployedAt;

    /// @dev Event emitted when a Safe signs a message and stores it.
    event SignMsg(bytes32 indexed msgHash);

    /// @dev The EIP-712 type hash used to prefix the message.
    bytes32 private constant safeMessageTypeHash =
        keccak256("SafeMessage(bytes message)");

    constructor() {
        deployedAt = address(this);
    }

    /**
     * @notice Marks a message as signed
     * @dev The message hash is marked as approved in SafeStorage
     * @dev Can be verified using EIP-1271 validation method by passing the
     *      message and empty bytes as the signature. Empty bytes as signature
     *      represent an on-chain signature
     * @param message The message to be signed
     */
    function signMessage(bytes calldata message) external {
        bytes32 safeMessageHash = hashSafeMessage(message);

        signedMessages[safeMessageHash] = 1;
        emit SignMsg(safeMessageHash);
    }

    /**
     * @notice Mark a typed structured message (EIP-712) as signed
     * @dev The typed message hash is marked as approved in SafeStorage
     * @dev Can be verified using EIP-1271 validation by passing the typed
     *      message hash as the message and empty bytes as the signature. Empty
     *      bytes as signature represent an on-chain signature
     * @param domain  The encoded EIP712 domain
     * @param message The encoded EIP712 message
     * @param types   The flattened EIP712 typedData definitions
     */
    function signTypedMessage(
        bytes calldata domain,
        bytes calldata message,
        EIP712Encoder.Types calldata types
    ) public {
        require(address(this) != deployedAt);
        bytes32 safeMessageHash = hashTypedSafeMessage(domain, message, types);

        signedMessages[safeMessageHash] = 1;
        emit SignMsg(safeMessageHash);
    }

    /**
     * @notice Packs a message, and produces the SafeMessage hash for it
     * @dev Follows Safe's internal type schema for signing messages
     *
     * @param message  The message to hash
     * @return bytes32 The resulting hash
     */
    function hashSafeMessage(
        bytes memory message
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    bytes2(0x1901),
                    ISafe(address(this)).domainSeparator(),
                    keccak256(
                        abi.encode(safeMessageTypeHash, keccak256(message))
                    )
                )
            );
    }

    /**
     * @notice Packs a typed message, and produces the SafeMessage hash for it
     * @dev Follows Safe's internal type schema for signing messages
     *
     * @param domain   The encoded EIP712 domain
     * @param message  The encoded EIP712 message
     * @param types    The flattened EIP712 type definitions
     * @return bytes32 The resulting hash
     */
    function hashTypedSafeMessage(
        bytes calldata domain,
        bytes calldata message,
        EIP712Encoder.Types calldata types
    ) public view returns (bytes32) {
        return
            hashSafeMessage(
                abi.encode(
                    EIP712Encoder.hashTypedMessage(domain, message, types)
                )
            );
    }

    /**
     * We make the signTypedMessage function available under any selector. This
     * allows scoping different layouts under different signTypedMessage
     * aliases. Useful for expressing roles permissions
     */
    fallback() external {
        bytes calldata domain;
        bytes calldata message;
        EIP712Encoder.Types calldata types;
        assembly {
            // offset to domain block
            domain.offset := add(calldataload(0x04), 0x24)
            domain.length := calldataload(sub(domain.offset, 0x20))

            // offset to message block
            message.offset := add(calldataload(0x24), 0x24)
            message.length := calldataload(sub(message.offset, 0x20))

            // offset to types block
            types := add(calldataload(0x44), 0x04)
        }
        signTypedMessage(domain, message, types);
    }
}

interface ISafe {
    function domainSeparator() external view returns (bytes32);
}
