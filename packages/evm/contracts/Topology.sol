// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title  Topology - a library that provides helper functions for dealing with
 * the flat representation of conditions.
 *
 * @author gnosisguild
 *
 */
library Topology {
    function childBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (uint256 start, uint256 length) {
        uint256 len = conditions.length;
        unchecked {
            for (uint256 i = index + 1; i < len; ++i) {
                uint256 parent = conditions[i].parent;

                if (parent == index) {
                    if (length == 0) start = i;
                    ++length;
                } else if (parent > index) {
                    break;
                }
            }
        }
    }

    function typeTreeId(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bytes32) {
        return _typeTreeId(typeTree(conditions, index));
    }

    function _typeTreeId(TypeTree memory tree) private pure returns (bytes32) {
        uint256 childCount = tree.children.length;
        if (childCount == 0) {
            return bytes32(uint256(tree._type));
        }

        bytes32[] memory ids = new bytes32[](childCount);
        for (uint256 i = 0; i < childCount; ++i) {
            ids[i] = _typeTreeId(tree.children[i]);
        }
        return keccak256(abi.encodePacked(bytes32(uint256(tree._type)), ids));
    }

    function typeTree(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (TypeTree memory node) {
        node._type = conditions[index].paramType;

        (uint256 childrenStart, uint256 childrenLength) = childBounds(
            conditions,
            index
        );

        if (childrenLength == 0) {
            return node;
        }

        Operator operator = conditions[index].operator;
        if (operator >= Operator.And && operator <= Operator.Nor) {
            return _logical(conditions, childrenStart, childrenLength);
        }

        if (node._type == AbiType.Array) {
            node.children = new TypeTree[](
                _isVariant(conditions, childrenStart, childrenLength)
                    ? childrenLength
                    : 1
            );
        } else {
            node.children = new TypeTree[](childrenLength);
        }

        unchecked {
            for (uint256 i = 0; i < node.children.length; ++i) {
                node.children[i] = typeTree(conditions, i + childrenStart);
            }
        }
    }

    function _logical(
        ConditionFlat[] memory conditions,
        uint256 childrenStart,
        uint256 childrenLength
    ) private pure returns (TypeTree memory node) {
        if (!_isVariant(conditions, childrenStart, childrenLength)) {
            return typeTree(conditions, childrenStart);
        }

        node._type = AbiType.Dynamic;
        node.children = new TypeTree[](childrenLength);
        unchecked {
            for (uint256 i = 0; i < childrenLength; ++i) {
                node.children[i] = typeTree(conditions, childrenStart + i);
            }
        }

        return node;
    }

    function _isVariant(
        ConditionFlat[] memory conditions,
        uint256 childrenStart,
        uint256 childrenLength
    ) internal pure returns (bool) {
        // Need at least 2 children to have a variant
        if (childrenLength <= 1) {
            return false;
        }

        // Check if any child can't be variant (Static, Tuple, Array)
        // If so, this can't be a variant
        unchecked {
            for (uint256 i = 0; i < childrenLength; ++i) {
                AbiType paramType = conditions[childrenStart + i].paramType;
                if (
                    paramType == AbiType.Static ||
                    paramType == AbiType.Tuple ||
                    paramType == AbiType.Array
                ) {
                    return false;
                }
            }
        }

        // Compare all children's type tree structures
        // If any two differ, it's a variant
        bytes32 id = typeTreeId(conditions, childrenStart);
        unchecked {
            for (uint256 i = 1; i < childrenLength; ++i) {
                if (id != typeTreeId(conditions, childrenStart + i))
                    return true;
            }
        }

        return false;
    }
}
