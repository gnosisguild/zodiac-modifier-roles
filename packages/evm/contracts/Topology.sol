// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library Topology {
    function childrenBounds(
        uint8[] memory parents,
        uint256 n
    ) internal pure returns (uint256 left, uint256 right) {
        uint256 length = parents.length;

        uint256 i = n + 1;
        while (i < length && parents[i] < n) {
            unchecked {
                ++i;
            }
        }

        if (i < length && parents[i] == n) {
            left = i;
            while (i < length && parents[i] == n) {
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
        ParameterConfig memory parameter
    ) internal pure returns (TypeTopology memory result) {
        if (parameter.comp == Comparison.OneOf) {
            return typeTree(parameter.children[0]);
        }

        result._type = parameter._type;

        if (parameter.children.length > 0) {
            uint256 length = parameter.children.length;

            result.children = new TypeTopology[](length);
            for (uint256 i; i < length; i++) {
                result.children[i] = typeTree(parameter.children[i]);
            }
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
}
