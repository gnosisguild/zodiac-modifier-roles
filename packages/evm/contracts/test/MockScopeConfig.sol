// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../ScopeConfig.sol";

contract MockScopeConfig {
    function packParameter(
        uint256 index,
        ScopeConfig.Packing[] memory modes,
        ConditionFlat memory parameter
    ) public pure returns (bytes memory buffer) {
        buffer = new bytes(1024);
        ScopeConfig.packParameter(buffer, index, modes, parameter);
    }

    function unpackCondition(
        bytes memory buffer,
        uint256 index,
        ScopeConfig.Packing[] memory modes
    ) public pure returns (ParameterType _type, Operator comp) {
        Condition memory p;
        ScopeConfig.unpackCondition(buffer, index, modes, p);
        return (p.paramType, p.operator);
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
