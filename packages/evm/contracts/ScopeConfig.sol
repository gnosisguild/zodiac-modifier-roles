// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library ScopeConfig {
    uint256 private constant MASK_LEFT =
        0xffff000000000000000000000000000000000000000000000000000000000000;
    uint256 private constant MASK_OPTIONS =
        0xc000000000000000000000000000000000000000000000000000000000000000;
    uint256 private constant MASK_WILDCARDED =
        0x2000000000000000000000000000000000000000000000000000000000000000;
    uint256 private constant MASK_LENGTH =
        0x00ff000000000000000000000000000000000000000000000000000000000000;

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
        // 32  bits -> isScoped
        // 114  bits -> paramType (3 bits per entry 32*3)
        // 114 bits -> paramComp (3 bits per entry 32*3)

        // Wipe the LEFT SIDE clean. Start from there
        scopeConfig = scopeConfig & ~MASK_LEFT;

        // set options -> 256 - 2 = 254
        scopeConfig |= uint256(options) << 254;

        // set isWildcarded -> 256 - 2 - 1 = 253
        if (isWildcarded) {
            scopeConfig |= 1 << 253;
        }

        // set Length -> 256 - 16 = 240
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
        (
            uint256 isScopedOffset,
            uint256 typeOffset,
            uint256 compOffset
        ) = _offsets(index);

        uint256 isScopedMask = 1 << isScopedOffset;
        uint256 typeMask = 7 << typeOffset;
        uint256 compMask = 7 << compOffset;

        if (isScoped) {
            scopeConfig |= isScopedMask;
        } else {
            scopeConfig &= ~isScopedMask;
        }

        scopeConfig &= ~typeMask;
        scopeConfig |= uint256(paramType) << typeOffset;

        scopeConfig &= ~compMask;
        scopeConfig |= uint256(paramComp) << compOffset;

        return scopeConfig;
    }

    function unpack(
        uint256 scopeConfig
    )
        internal
        pure
        returns (ExecutionOptions options, bool isWildcarded, uint256 length)
    {
        options = ExecutionOptions(scopeConfig >> 254);
        isWildcarded = scopeConfig & MASK_WILDCARDED != 0;
        length = (scopeConfig & MASK_LENGTH) >> 240;
    }

    function unpackParameter(
        uint256 scopeConfig,
        uint256 index
    )
        internal
        pure
        returns (bool isScoped, ParameterType paramType, Comparison paramComp)
    {
        (
            uint256 isScopedOffset,
            uint256 typeOffset,
            uint256 compOffset
        ) = _offsets(index);

        uint256 isScopedMask = 1 << isScopedOffset;
        uint256 typeMask = 7 << typeOffset;
        uint256 compMask = 7 << compOffset;

        isScoped = (scopeConfig & isScopedMask) != 0;
        paramType = ParameterType((scopeConfig & typeMask) >> typeOffset);
        paramComp = Comparison((scopeConfig & compMask) >> compOffset);
    }

    function _offsets(
        uint256 index
    )
        private
        pure
        returns (uint256 isScopedOffset, uint256 typeOffset, uint256 compOffset)
    {
        // LEFT SIDE
        // 2   bits -> options
        // 1   bits -> isWildcarded
        // 5   bits -> unused
        // 8   bits -> length
        // RIGHT SIDE
        // 32  bits -> isScoped
        // 96  bits -> paramType (3 bits per entry 32*3)
        // 96  bits -> paramComp (3 bits per entry 32*3)

        isScopedOffset = index + 96 + 96;
        typeOffset = index * 3 + 96;
        compOffset = index * 3;
    }
}
