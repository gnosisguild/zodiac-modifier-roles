// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.21 <0.9.0;

import "../periphery/EIP712Encoder.sol";

/**
 * @title MockEIP712Encoder - Test wrapper for EIP712Encoder
 * @dev Exposes internal EIP712Encoder functions for integration testing
 */
contract MockEIP712Encoder {
    function hashTypedMessage(
        bytes calldata domain,
        bytes calldata message,
        EIP712Encoder.Types calldata types
    ) external pure returns (bytes32) {
        return EIP712Encoder.hashTypedMessage(domain, message, types);
    }

    function hashTypedDomain(
        bytes calldata data,
        EIP712Encoder.Types calldata types
    ) external pure returns (bytes32) {
        return EIP712Encoder.hashTypedDomain(data, types);
    }
}
