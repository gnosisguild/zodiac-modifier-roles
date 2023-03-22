// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../ScopeConfig.sol";

contract MockScopeConfig {
    function packHeader(
        uint256 length,
        bool isWildcarded,
        ExecutionOptions options,
        address pointer
    ) public pure returns (bytes32 result) {
        return ScopeConfig.packHeader(length, isWildcarded, options, pointer);
    }

    function unpackHeader(
        bytes32 header
    )
        public
        pure
        returns (
            uint256 _length,
            bool isWildcarded,
            ExecutionOptions options,
            address pointer
        )
    {
        return ScopeConfig.unpackHeader(header);
    }
}
