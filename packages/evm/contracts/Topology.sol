// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

struct Bounds {
    uint256 left;
    uint256 right;
}

library Topology {
    function typeTree(
        ParameterConfig memory parameter
    ) internal pure returns (TypeTopology memory result) {
        if (
            parameter.comp == Comparison.And || parameter.comp == Comparison.Or
        ) {
            return typeTree(parameter.children[0]);
        }

        result._type = parameter._type;
        if (parameter.children.length > 0) {
            uint256 length = parameter.children.length;

            result.children = new TypeTopology[](length);
            for (uint256 i; i < length; ) {
                result.children[i] = typeTree(parameter.children[i]);
                unchecked {
                    ++i;
                }
            }
        }
    }

    function childrenBounds(
        uint8[] memory parents
    ) internal pure returns (Bounds[] memory result) {
        uint256 count = parents.length;
        assert(count > 0);

        result = new Bounds[](parents.length);
        result[0].left = type(uint256).max;

        // parents are BFS ordered, so we can use this to find the bounds
        // 0 is the root
        for (uint256 i = 1; i < count; ) {
            result[i].left = type(uint256).max;
            Bounds memory bounds = result[parents[i]];
            if (bounds.left == type(uint256).max) {
                bounds.left = i;
            }
            bounds.right = i;
            unchecked {
                ++i;
            }
        }
    }

    function isStatic(
        ParameterConfig memory parameter
    ) internal pure returns (bool) {
        if (parameter._type == ParameterType.Static) {
            return true;
        } else if (parameter._type == ParameterType.Tuple) {
            for (uint256 i; i < parameter.children.length; ++i) {
                if (!isStatic(parameter.children[i])) return false;
            }
            return true;
        } else {
            return false;
        }
    }

    function isStatic(
        ParameterConfigFlat[] memory parameters,
        uint256 index
    ) internal pure returns (bool) {
        ParameterType _type = parameters[index]._type;

        if (_type == ParameterType.Static) {
            return true;
        } else if (_type == ParameterType.Tuple) {
            uint256 count = parameters.length;
            for (uint256 j = index + 1; j < count; ++j) {
                if (parameters[j].parent != index) {
                    continue;
                }
                if (!isStatic(parameters, j)) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }
}
