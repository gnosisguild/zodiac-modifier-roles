// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ScopeConfig.sol";
import "./Types.sol";

struct Bounds {
    uint256 left;
    uint256 right;
}

library ParameterLayout {
    function childrenBounds(
        BitmapBuffer memory scopeConfig,
        uint256 parent
    ) internal pure returns (uint256 left, uint256 right) {
        (uint256 length, , ) = ScopeConfig.unpackHeader(scopeConfig);

        uint256 i = parent + 1;
        while (
            i < length && ScopeConfig.unpackParent(scopeConfig, i) < parent
        ) {
            unchecked {
                ++i;
            }
        }

        if (i < length) {
            left = i;
            while (
                i < length && ScopeConfig.unpackParent(scopeConfig, i) == parent
            ) {
                unchecked {
                    ++i;
                }
            }
            right = i - 1;
            assert(left <= right);
        } else {
            left = type(uint256).max;
            right = 0;
        }
    }
}
