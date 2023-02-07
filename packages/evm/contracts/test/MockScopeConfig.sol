// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../bitmaps/ScopeConfig.sol";

contract MockScopeConfig {
    // function pack(
    //     uint256 scopeConfig,
    //     ExecutionOptions options,
    //     bool isWildcarded,
    //     uint256 length
    // ) public pure returns (uint256) {
    //     return ScopeConfig2.pack(scopeConfig, options, isWildcarded, length);
    // }

    // function packParameter(
    //     uint256 scopeConfig,
    //     uint256 index,
    //     bool isScoped,
    //     ParameterType paramType,
    //     Comparison paramComp
    // ) public pure returns (uint256) {
    //     return
    //         ScopeConfig.packParameter(
    //             scopeConfig,
    //             index,
    //             isScoped,
    //             paramType,
    //             paramComp
    //         );
    // }

    // function unpack(
    //     uint256 scopeConfig
    // )
    //     public
    //     pure
    //     returns (ExecutionOptions options, bool isWildcarded, uint256 length)
    // {
    //     return ScopeConfig.unpack(scopeConfig);
    // }

    // function unpackParameter(
    //     uint256 scopeConfig,
    //     uint256 index
    // )
    //     public
    //     pure
    //     returns (bool isScoped, ParameterType paramType, Comparison paramComp)
    // {
    //     return ScopeConfig.unpackParameter(scopeConfig, index);
    // }

    function _parameterOffset(
        uint256 index
    ) public pure returns (uint256 page, uint256 offset) {
        (page, offset) = ScopeConfig._parameterOffset(index);
    }
}
