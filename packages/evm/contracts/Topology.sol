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

        if (i < length && ScopeConfig.unpackParent(scopeConfig, i) == parent) {
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
        if (isVariantEntrypoint(inputs)) {
            return typeTree(inputs[0].children[0].children);
        }

        if (isExplicitEntrypoint(inputs)) {
            return typeTree(inputs[0].children);
        }

        result = new TypeTopology[](inputs.length);
        for (uint256 i; i < inputs.length; i++) {
            result[i] = typeTree(inputs[i]);
        }
    }

    function typeTree(
        ParameterConfig memory parameter
    ) internal pure returns (TypeTopology memory result) {
        if (parameter.comp == Comparison.OneOf) {
            return typeTree(parameter.children[0]);
        }

        result._type = parameter._type;
        if (parameter._type == ParameterType.Array) {
            result.children = new TypeTopology[](1);
            result.children[0] = typeTree(parameter.children[0]);
        } else if (parameter._type == ParameterType.Tuple) {
            result.children = typeTree(parameter.children);
        }
    }

    function isStatic(
        TypeTopology memory typeNode
    ) internal pure returns (bool) {
        if (typeNode._type == ParameterType.Static) {
            return true;
        } else if (typeNode._type == ParameterType.Tuple) {
            for (uint256 i; i < typeNode.children.length; ++i) {
                if (!isStatic(typeNode.children[i])) return false;
            }
            return true;
        } else {
            return false;
        }
    }

    function typeSize(
        TypeTopology memory typeNode
    ) internal pure returns (uint256) {
        if (typeNode._type == ParameterType.Static) {
            return 32;
        }

        // should only be called for static types
        assert(typeNode._type == ParameterType.Tuple);

        uint256 result;
        for (uint256 i; i < typeNode.children.length; ++i) {
            result += typeSize(typeNode.children[i]);
        }

        return result;
    }

    function isVariantEntrypoint(
        ParameterConfig[] memory configs
    ) internal pure returns (bool) {
        return
            configs.length == 1 &&
            configs[0]._type == ParameterType.Function &&
            configs[0].comp == Comparison.OneOf;
    }

    function isExplicitEntrypoint(
        ParameterConfig[] memory configs
    ) internal pure returns (bool) {
        return
            configs[0]._type == ParameterType.Function &&
            configs[0].comp != Comparison.OneOf;
    }
}
