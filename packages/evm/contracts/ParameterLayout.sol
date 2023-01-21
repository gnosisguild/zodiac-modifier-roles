// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ScopeConfig.sol";
import "./Types.sol";

struct Bounds {
    uint256 left;
    uint256 right;
}

library ParameterLayout {
    error MalformedFlatParameter(uint256 index);

    function rootBounds(
        ParameterConfigFlat[] memory configs
    ) internal pure returns (Bounds memory bounds) {
        bounds.left = 0;

        uint256 i;
        while (i < configs.length && configs[i].parent == i) {
            unchecked {
                ++i;
            }
        }
        bounds.right = i - 1;
        assert(bounds.left <= bounds.right);
    }

    function childrenBounds(
        ParameterConfigFlat[] memory configs,
        uint256 parent
    ) internal pure returns (bool hasChildren, Bounds memory bounds) {
        uint256 length = configs.length;

        uint256 i = parent + 1;
        while (i < length && configs[i].parent != parent) {
            unchecked {
                ++i;
            }
        }

        bounds.left = i;
        hasChildren = bounds.left < length;

        while (i < configs.length && configs[i].parent == parent) {
            unchecked {
                ++i;
            }
        }
        bounds.right = i - 1;
        assert(!hasChildren || bounds.left <= bounds.right);
    }
}
