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

    function typeTree(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (TypeTree memory node) {
        AbiType _type = conditions[index].paramType;

        Operator operator = conditions[index].operator;
        if (operator >= Operator.And && operator <= Operator.Nor) {
            return _variant(conditions, index);
        }

        node._type = _type;
        (uint256 start, uint256 length) = childBounds(conditions, index);
        if (length > 0) {
            node.children = new TypeTree[](_type == AbiType.Array ? 1 : length);
            for (uint256 i = 0; i < node.children.length; i++) {
                node.children[i] = typeTree(conditions, i + start);
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

        // For small counts, unroll the loop
        if (childCount == 1) {
            return
                keccak256(
                    abi.encodePacked(
                        bytes32(uint256(tree._type)),
                        _typeTreeId(tree.children[0])
                    )
                );
        }

        if (childCount == 2) {
            return
                keccak256(
                    abi.encodePacked(
                        bytes32(uint256(tree._type)),
                        _typeTreeId(tree.children[0]),
                        _typeTreeId(tree.children[1])
                    )
                );
        }

        bytes32[] memory ids = new bytes32[](childCount);
        for (uint256 i = 0; i < childCount; ++i) {
            ids[i] = _typeTreeId(tree.children[i]);
        }
        return keccak256(abi.encodePacked(bytes32(uint256(tree._type)), ids));
    }

    function _variant(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (TypeTree memory result) {
        (uint256 childrenStart, uint256 childrenLength) = childBounds(
            conditions,
            index
        );
        assert(childrenStart > 0);

        if (_cantBeVariant(conditions, childrenStart, childrenLength)) {
            // Non-variant type found, return first element's tree
            return typeTree(conditions, childrenStart);
        }

        return
            _variantResolve(conditions, childrenStart, childrenLength, false);
    }

    function _cantBeVariant(
        ConditionFlat[] memory conditions,
        uint256 start,
        uint256 length
    ) private pure returns (bool) {
        /*
         * We operate under the assumption that a condition tree reaching
         * this point has been validated for integrity
         */
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                AbiType paramType = conditions[start + i].paramType;
                if (
                    paramType == AbiType.Static ||
                    paramType == AbiType.Tuple ||
                    paramType == AbiType.Array
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function _variantResolve(
        ConditionFlat[] memory conditions,
        uint256 childrenStart,
        uint256 childrenLength,
        bool isVariant
    ) private pure returns (TypeTree memory node) {
        node._type = AbiType.Dynamic;
        node.children = new TypeTree[](childrenLength);

        bytes32 id;
        unchecked {
            for (uint256 i = 0; i < childrenLength; i++) {
                node.children[i] = typeTree(conditions, childrenStart + i);

                if (!isVariant) {
                    bytes32 currentId = _typeTreeId(node.children[i]);

                    if (id == 0) {
                        id = currentId;
                    } else if (id != currentId) {
                        isVariant = true;
                    }
                }
            }
        }

        return isVariant ? node : node.children[0];
    }
}
