// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

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
