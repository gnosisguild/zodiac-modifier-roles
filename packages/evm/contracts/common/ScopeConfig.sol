// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {ExecutionOptions} from "../types/Permission.sol";

library ScopeConfig {
    /**
     * Bit-packed configuration (bytes32):
     * ┌───────────────────┬────────────┬─────────┬───────────────────────┐
     * │      (unused)     │ wildcarded │ options │        pointer        │
     * │      87 bits      │   1 bit    │ 8 bits  │        160 bits       │
     * └───────────────────┴────────────┴─────────┴───────────────────────┘
     */
    function pack(
        ExecutionOptions options,
        address pointer
    ) internal pure returns (bytes32) {
        return bytes32((uint256(options) << 160) | uint256(uint160(pointer)));
    }

    function packAsWildcarded(
        ExecutionOptions options
    ) internal pure returns (bytes32) {
        return bytes32((1 << 168) | (uint256(options) << 160));
    }

    function unpack(
        bytes32 scopeConfig
    )
        internal
        pure
        returns (bool isWildcarded, ExecutionOptions options, address pointer)
    {
        isWildcarded = (uint256(scopeConfig) & (1 << 168)) != 0;
        options = ExecutionOptions((uint256(scopeConfig) >> 160) & 0xFF);
        pointer = address(uint160(uint256(scopeConfig)));
    }
}
