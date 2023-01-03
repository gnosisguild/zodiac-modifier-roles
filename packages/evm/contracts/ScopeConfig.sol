// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library ScopeConfig {
    function pack(
        uint256 scopeConfig,
        ExecutionOptions options,
        bool isWildcarded,
        uint256 length
    ) internal pure returns (uint256) {
        // LEFT SIDE
        // 2   bits -> options
        // 1   bits -> isWildcarded
        // 5   bits -> unused
        // 8   bits -> length
        // RIGHT SIDE
        // 38  bits -> isScoped
        // 72  bits -> paramType (2 bits per entry 38*2)
        // 114 bits -> paramComp (3 bits per entry 38*3)

        // Wipe the LEFT SIDE clean. Start from there
        scopeConfig = (scopeConfig << 16) >> 16;

        // set options -> 256 - 2 = 254
        scopeConfig |= uint256(options) << 254;

        // set isWildcarded -> 256 - 2 - 1 = 253
        if (isWildcarded) {
            scopeConfig |= 1 << 253;
        }

        // set Length -> 48 + 96 + 96 = 240
        scopeConfig |= length << 240;

        return scopeConfig;
    }

    function packParameter(
        uint256 scopeConfig,
        uint256 index,
        bool isScoped,
        ParameterType paramType,
        Comparison paramComp
    ) internal pure returns (uint256) {
        // LEFT SIDE
        // 2   bits -> options
        // 1   bits -> isWildcarded
        // 5   bits -> unused
        // 8   bits -> length
        // RIGHT SIDE
        // 38  bits -> isScoped
        // 72  bits -> paramType (2 bits per entry 38*2)
        // 114 bits -> paramComp (3 bits per entry 38*3)
        uint256 isScopedMask = 1 << (index + 72 + 114);
        uint256 paramTypeMask = 3 << (index * 2 + 114);
        uint256 paramCompMask = 7 << (index * 3);

        if (isScoped) {
            scopeConfig |= isScopedMask;
        } else {
            scopeConfig &= ~isScopedMask;
        }

        scopeConfig &= ~paramTypeMask;
        scopeConfig |= uint256(paramType) << (index * 2 + 114);

        scopeConfig &= ~paramCompMask;
        scopeConfig |= uint256(paramComp) << (index * 3);

        return scopeConfig;
    }

    function unpack(
        uint256 scopeConfig
    )
        internal
        pure
        returns (ExecutionOptions options, bool isWildcarded, uint256 length)
    {
        uint256 isWildcardedMask = 1 << 253;

        options = ExecutionOptions(scopeConfig >> 254);
        isWildcarded = scopeConfig & isWildcardedMask != 0;
        length = (scopeConfig << 8) >> 248;
    }

    function unpackParameter(
        uint256 scopeConfig,
        uint256 index
    )
        internal
        pure
        returns (bool isScoped, ParameterType paramType, Comparison paramComp)
    {
        uint256 isScopedMask = 1 << (index + 72 + 114);
        uint256 paramTypeMask = 3 << (index * 2 + 114);
        uint256 paramCompMask = 7 << (index * 3);

        isScoped = (scopeConfig & isScopedMask) != 0;
        paramType = ParameterType(
            (scopeConfig & paramTypeMask) >> (index * 2 + 114)
        );
        paramComp = Comparison((scopeConfig & paramCompMask) >> (index * 3));
    }
}
