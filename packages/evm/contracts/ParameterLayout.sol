// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ScopeConfig.sol";
import "./Types.sol";

struct Bounds {
    uint256 left;
    uint256 right;
}

library ParameterLayout {
    function rootBounds(
        BitmapBuffer memory scopeConfig
    ) internal pure returns (Bounds memory bounds) {
        (uint256 length, , ) = ScopeConfig.unpackHeader(scopeConfig);
        uint256 i;
        while (i < length && ScopeConfig.unpackParent(scopeConfig, i) == i) {
            unchecked {
                ++i;
            }
        }
        bounds.right = i - 1;
        assert(bounds.left <= bounds.right);
    }

    function childrenBounds(
        BitmapBuffer memory scopeConfig,
        uint256 parent
    ) internal pure returns (bool hasChildren, Bounds memory bounds) {
        (uint256 length, , ) = ScopeConfig.unpackHeader(scopeConfig);

        uint256 i = parent + 1;
        while (
            i < length && ScopeConfig.unpackParent(scopeConfig, i) != parent
        ) {
            unchecked {
                ++i;
            }
        }
        bounds.left = i;
        hasChildren = bounds.left < length;

        if (hasChildren) {
            while (
                i < length && ScopeConfig.unpackParent(scopeConfig, i) == parent
            ) {
                unchecked {
                    ++i;
                }
            }
            bounds.right = i - 1;
            assert(bounds.left <= bounds.right);
        }
    }
}
