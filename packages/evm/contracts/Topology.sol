// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

library Topology {
    struct TypeTree {
        ParameterType paramType;
        TypeTree[] children;
    }

    struct Bounds {
        uint256 start;
        uint256 end;
        uint256 length;
    }

    function childrenBounds(
        ConditionFlat[] memory conditions
    ) internal pure returns (Bounds[] memory result) {
        uint256 count = conditions.length;
        assert(count > 0);

        // parents are breadth-first
        result = new Bounds[](count);
        result[0].start = type(uint256).max;

        // first item is the root
        for (uint256 i = 1; i < count; ) {
            result[i].start = type(uint256).max;
            Bounds memory parentBounds = result[conditions[i].parent];
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
        ParameterType paramType = node.paramType;
        assert(paramType != ParameterType.None);

        if (paramType == ParameterType.Static) {
            return true;
        } else if (
            paramType == ParameterType.Dynamic ||
            paramType == ParameterType.Array ||
            paramType == ParameterType.AbiEncoded
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
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bool) {
        ParameterType paramType = conditions[index].paramType;

        if (paramType == ParameterType.Static) {
            return true;
        } else if (
            paramType == ParameterType.Dynamic ||
            paramType == ParameterType.Array ||
            paramType == ParameterType.AbiEncoded
        ) {
            return false;
        } else {
            uint256 length = conditions.length;
            for (uint256 j = index + 1; j < length; ++j) {
                if (conditions[j].parent != index) {
                    continue;
                }
                if (!isInline(conditions, j)) {
                    return false;
                }
            }
            return true;
        }
    }

    function typeTree(
        Condition memory condition
    ) internal pure returns (TypeTree memory result) {
        if (
            condition.operator == Operator.And ||
            condition.operator == Operator.Or
        ) {
            return typeTree(condition.children[0]);
        }

        result.paramType = condition.paramType;
        if (condition.children.length > 0) {
            uint256 length = condition.children.length;
            result.children = new TypeTree[](length);
            for (uint256 i; i < length; ) {
                result.children[i] = typeTree(condition.children[i]);
                unchecked {
                    ++i;
                }
            }
        }
    }
}
