// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ScopeConfig.sol";
import "./Types.sol";

struct Bounds {
    uint256 left;
    uint256 right;
}

library Topology {
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

    function prune(
        ParameterConfig memory input
    ) internal pure returns (ParameterTopology memory result) {
        if (input._type == ParameterType.OneOf) {
            return prune(input.children[0]);
        }

        result._type = input._type;
        result.comp = input.comp;
        if (input._type == ParameterType.Array) {
            result.children = new ParameterTopology[](1);
            result.children[0] = prune(input.children[0]);
        } else if (input._type == ParameterType.Tuple) {
            result.children = new ParameterTopology[](input.children.length);
            for (uint256 i; i < input.children.length; i++) {
                result.children[i] = prune(input.children[i]);
            }
        }
    }
}
