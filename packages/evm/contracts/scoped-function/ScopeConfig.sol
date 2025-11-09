// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

library ScopeConfig {
    // Word Layout:
    // [255..169] -> unused (87 bits)
    // [168]      -> isWildcarded (1 bit)
    // [167..160] -> options (8 bits)
    // [159..0]   -> pointer (address)

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
        bytes32 header
    )
        internal
        pure
        returns (bool isWildcarded, ExecutionOptions options, address pointer)
    {
        isWildcarded = (uint256(header) & (1 << 168)) != 0;
        options = ExecutionOptions((uint256(header) >> 160) & 0xFF);
        pointer = address(uint160(uint256(header)));
    }
}
