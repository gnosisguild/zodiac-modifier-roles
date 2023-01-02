// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library FunctionConfig {
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
        // 48  bits -> isScoped
        // 96  bits -> paramType (2 bits per entry 48*2)
        // 96  bits -> paramComp (2 bits per entry 48*2)

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
        // 48  bits -> isScoped
        // 96  bits -> paramType (2 bits per entry 48*2)
        // 96  bits -> paramComp (2 bits per entry 48*2)
        uint256 isScopedMask = 1 << (index + 96 + 96);
        uint256 paramTypeMask = 3 << (index * 2 + 96);
        uint256 paramCompMask = 3 << (index * 2);

        if (isScoped) {
            scopeConfig |= isScopedMask;
        } else {
            scopeConfig &= ~isScopedMask;
        }

        scopeConfig &= ~paramTypeMask;
        scopeConfig |= uint256(paramType) << (index * 2 + 96);

        scopeConfig &= ~paramCompMask;
        scopeConfig |= uint256(paramComp) << (index * 2);

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
        uint256 isScopedMask = 1 << (index + 96 + 96);
        uint256 paramTypeMask = 3 << (index * 2 + 96);
        uint256 paramCompMask = 3 << (index * 2);

        isScoped = (scopeConfig & isScopedMask) != 0;
        paramType = ParameterType(
            (scopeConfig & paramTypeMask) >> (index * 2 + 96)
        );
        paramComp = Comparison((scopeConfig & paramCompMask) >> (index * 2));
    }
}
