// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title Topology - a library that provides helper functions for dealing with
 * the flat representation of conditions.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
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

        unchecked {
            // parents are breadth-first
            result = new Bounds[](count);
            result[0].start = type(uint256).max;

            // first item is the root
            for (uint256 i = 1; i < count; ++i) {
                result[i].start = type(uint256).max;
                Bounds memory parentBounds = result[conditions[i].parent];
                if (parentBounds.start == type(uint256).max) {
                    parentBounds.start = i;
                }
                parentBounds.end = i + 1;
                parentBounds.length = parentBounds.end - parentBounds.start;
            }
        }
    }

    function isInline(TypeTree memory node) internal pure returns (bool) {
        ParameterType paramType = node.paramType;
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
            unchecked {
                for (uint256 i; i < length; ++i) {
                    if (!isInline(node.children[i])) {
                        return false;
                    }
                }
            }
            return true;
        }
    }

    function typeTree(
        Condition memory condition
    ) internal pure returns (TypeTree memory result) {
        unchecked {
            if (
                condition.operator >= Operator.And &&
                condition.operator <= Operator.Xor
            ) {
                assert(condition.children.length > 0);
                return typeTree(condition.children[0]);
            }

            result.paramType = condition.paramType;
            if (condition.children.length > 0) {
                uint256 length = condition.paramType == ParameterType.Array
                    ? 1
                    : condition.children.length;
                result.children = new TypeTree[](length);

                for (uint256 i; i < length; ++i) {
                    result.children[i] = typeTree(condition.children[i]);
                }
            }
        }
    }

    function typeTree(
        ConditionFlat[] memory conditions,
        uint256 index,
        Bounds[] memory bounds
    ) internal pure returns (TypeTree memory result) {
        ConditionFlat memory condition = conditions[index];
        if (
            condition.operator >= Operator.And &&
            condition.operator <= Operator.Xor
        ) {
            assert(bounds[index].length > 0);
            return typeTree(conditions, bounds[index].start, bounds);
        }

        result.paramType = condition.paramType;
        if (bounds[index].length > 0) {
            uint256 start = bounds[index].start;
            uint256 end = condition.paramType == ParameterType.Array
                ? bounds[index].start + 1
                : bounds[index].end;
            result.children = new TypeTree[](end - start);
            for (uint256 i = start; i < end; ++i) {
                result.children[i - start] = typeTree(conditions, i, bounds);
            }
        }
    }
}
