// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ScopeConfig.sol";
import "./Types.sol";

library Topology {
    function rootBounds(
        BitmapBuffer memory scopeConfig
    ) internal pure returns (uint256 left, uint256 right) {
        (uint256 length, , ) = ScopeConfig.unpackHeader(scopeConfig);

        uint256 i = 1;
        while (i < length && ScopeConfig.unpackParent(scopeConfig, i) == i) {
            unchecked {
                ++i;
            }
        }
        right = i - 1;
        assert(left <= right);
    }

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

    function typeTree(
        ParameterConfig[] memory input
    ) internal pure returns (TypeTopology[] memory result) {
        result = new TypeTopology[](0);
        for (uint256 i; i < input.length; i++) {
            result = spread(result, typeTree(input[i]));
        }
    }

    function typeTree(
        ParameterConfig memory input
    ) internal pure returns (TypeTopology[] memory result) {
        if (input._type == ParameterType.Signature) {
            return typeTree(input.children);
        } else if (input._type == ParameterType.OneOf) {
            return typeTree(input.children[0]);
        } else {
            result = new TypeTopology[](1);
            result[0]._type = input._type;
            if (
                input._type == ParameterType.Array ||
                input._type == ParameterType.Tuple
            ) {
                result[0].children = typeTree(input.children);
            }
        }
    }

    function spread(
        TypeTopology[] memory t1,
        TypeTopology[] memory t2
    ) private pure returns (TypeTopology[] memory result) {
        result = new TypeTopology[](t1.length + t2.length);

        for (uint256 i; i < t1.length; ++i) {
            result[i] = t1[i];
        }
        for (uint256 i; i < t2.length; ++i) {
            result[t1.length + i] = t2[i];
        }
    }
}
