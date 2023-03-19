// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library Topology {
    struct TypeTree {
        ParameterType _type;
        TypeTree[] children;
    }

    struct Bounds {
        uint256 start;
        uint256 end;
        uint256 length;
    }

    function childrenBounds(
        ParameterConfigFlat[] memory parameters
    ) internal pure returns (Bounds[] memory result) {
        uint256 paramCount = parameters.length;
        assert(paramCount > 0);

        result = new Bounds[](paramCount);
        result[0].start = type(uint256).max;

        // parents are BFS ordered, so we can use this to find the bounds
        // 0 is the root
        for (uint256 i = 1; i < paramCount; ) {
            result[i].start = type(uint256).max;
            Bounds memory parentBounds = result[parameters[i].parent];
            if (parentBounds.start == type(uint256).max) {
                parentBounds.start = i;
            }
            parentBounds.end = i + 1;
            parentBounds.length = parentBounds.end - parentBounds.start;
            unchecked {
                ++i;
            }
        }
    }

    function isInline(TypeTree memory node) internal pure returns (bool) {
        assert(node._type != ParameterType.None);

        if (node._type == ParameterType.Static) {
            return true;
        } else if (
            node._type == ParameterType.Dynamic ||
            node._type == ParameterType.Array ||
            node._type == ParameterType.AbiEncoded
        ) {
            return false;
        } else {
            uint256 length = node.children.length;
            for (uint256 i; i < length; ) {
                if (!isInline(node.children[i])) {
                    return false;
                }
                unchecked {
                    ++i;
                }
            }
            return true;
        }
    }

    function isInline(
        ParameterConfigFlat[] memory parameters,
        uint256 index
    ) internal pure returns (bool) {
        ParameterType _type = parameters[index]._type;

        if (_type == ParameterType.Static) {
            return true;
        } else if (
            _type == ParameterType.Dynamic ||
            _type == ParameterType.Array ||
            _type == ParameterType.AbiEncoded
        ) {
            return false;
        } else {
            uint256 length = parameters.length;
            for (uint256 j = index + 1; j < length; ++j) {
                if (parameters[j].parent != index) {
                    continue;
                }
                if (!isInline(parameters, j)) {
                    return false;
                }
            }
            return true;
        }
    }

    function typeTree(
        ParameterConfig memory parameter
    ) internal pure returns (TypeTree memory result) {
        if (
            parameter.comp == Comparison.And || parameter.comp == Comparison.Or
        ) {
            return typeTree(parameter.children[0]);
        }

        result._type = parameter._type;
        if (parameter.children.length > 0) {
            uint256 length = parameter.children.length;
            result.children = new TypeTree[](length);
            for (uint256 i; i < length; ) {
                result.children[i] = typeTree(parameter.children[i]);
                unchecked {
                    ++i;
                }
            }
        }
    }
}
