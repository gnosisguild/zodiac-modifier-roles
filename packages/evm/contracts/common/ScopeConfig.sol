// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {ExecutionOptions} from "../types/Permission.sol";

library ScopeConfig {
    /**
     * Bit-packed configuration (uint256):
     * ┌─────────────────────────────┬─────────┬───────────────────────┐
     * │          (unused)           │ options │        pointer        │
     * │          94 bits            │ 2 bits  │        160 bits       │
     * └─────────────────────────────┴─────────┴───────────────────────┘
     */
    function pack(
        ExecutionOptions options,
        address pointer
    ) internal pure returns (uint256) {
        return (uint256(options) << 160) | uint256(uint160(pointer));
    }

    function unpack(
        uint256 scopeConfig
    ) internal pure returns (ExecutionOptions options, address pointer) {
        options = ExecutionOptions((scopeConfig >> 160) & 0x3);
        pointer = address(uint160(scopeConfig));
    }
}
