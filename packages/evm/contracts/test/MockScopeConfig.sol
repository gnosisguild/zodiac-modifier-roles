// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../ScopeConfig.sol";

contract MockScopeConfig {
    function packParameter(
        uint256 index,
        ParameterConfigFlat calldata parameter,
        bool isHashed
    ) public pure returns (bytes memory buffer) {
        buffer = new bytes(1024);
        ScopeConfig.packParameter(buffer, index, parameter, isHashed);
    }

    function unpackParameter(
        bytes memory buffer,
        uint256 index
    )
        public
        pure
        returns (ParameterType _type, Comparison comp, bool isHashed)
    {
        ParameterConfig memory p = ScopeConfig.unpackParameter(buffer, index);
        return (p._type, p.comp, p.isHashed);
    }

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
