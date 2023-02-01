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
        ParameterConfig[] memory inputs
    ) internal pure returns (TypeTopology[] memory result) {
        if (isVariantSignature(inputs)) {
            return typeTree(inputs[0].children[0].children);
        }

        if (isExplicitSignature(inputs)) {
            return typeTree(inputs[0].children);
        }

        result = new TypeTopology[](inputs.length);
        for (uint256 i; i < inputs.length; i++) {
            result[i] = typeTree(inputs[i]);
        }
    }

    function typeTree(
        ParameterConfig memory input
    ) internal pure returns (TypeTopology memory result) {
        if (input._type == ParameterType.OneOf) {
            return typeTree(input.children[0]);
        }

        result._type = input._type;
        if (input._type == ParameterType.Array) {
            result.children = new TypeTopology[](1);
            result.children[0] = typeTree(input.children[0]);
        } else if (input._type == ParameterType.Tuple) {
            result.children = typeTree(input.children);
        }
    }

    function isVariantSignature(
        ParameterConfig[] memory configs
    ) internal pure returns (bool) {
        return
            configs[0]._type == ParameterType.OneOf &&
            configs[0].children[0]._type == ParameterType.Signature;
    }

    function isExplicitSignature(
        ParameterConfig[] memory configs
    ) internal pure returns (bool) {
        return configs[0]._type == ParameterType.Signature;
    }
}
