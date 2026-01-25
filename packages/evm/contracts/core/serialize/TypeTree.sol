// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";
import "./Topology.sol";

/**
 * @title  TypeTree
 * @notice Extracts type trees from flat conditions for use in decoding.
 *         Variants can appear in logical or array nodes and must be handled.
 *         See inline comments for rules
 *
 * @author gnosisguild
 */
library TypeTree {
    /**
     * @notice Resolves through transparent (non-variant) And/Or chains to find actual encoding
     */
    function resolvesTo(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (Encoding) {
        return inspect(conditions, index).encoding;
    }

    /**
     * @notice Extracts type tree for flat node at index
     */
    function inspect(
        ConditionFlat[] memory conditions,
        uint256 i
    ) internal pure returns (Layout memory layout) {
        bool isLogical = _isLogical(conditions, i);
        bool isNonVariant = !isVariant(conditions, i);
        (uint256 childStart, uint256 childCount) = Topology.childBounds(
            conditions,
            i
        );

        if (isLogical && isNonVariant) {
            /*
             * Non-variant logical nodes: first structural child defines the type tree
             */
            for (uint256 j; j < childCount; ++j) {
                if (id(conditions, childStart + j) != bytes32(0)) {
                    return inspect(conditions, childStart + j);
                }
            }
            return layout;
        }

        layout.encoding = conditions[i].paramType == Encoding.EtherValue
            ? Encoding.None
            : conditions[i].paramType;
        layout.children = new Layout[](childCount);

        uint256 length;
        for (uint256 j; j < layout.children.length; ++j) {
            if (id(conditions, childStart + j) != bytes32(0)) {
                layout.children[length++] = inspect(conditions, childStart + j);

                /*
                 * For non-variant arrays, the first child serves as a template for
                 * all elements. For all other nodes, traverse all structural children
                 */
                if (layout.encoding == Encoding.Array && isNonVariant) {
                    break;
                }
            }
        }
        assembly {
            mstore(mload(add(layout, 0x40)), length)
        }

        layout.inlined = Topology.isInlined(conditions, i);
    }

    /**
     * @notice Checks if a node is a variant (children have different type trees)
     */
    function isVariant(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bool) {
        Encoding encoding = conditions[index].paramType;
        Operator operator = conditions[index].operator;
        if (
            encoding != Encoding.Array &&
            operator != Operator.And &&
            operator != Operator.Or
        ) {
            return false;
        }

        (uint256 childStart, uint256 childCount) = Topology.childBounds(
            conditions,
            index
        );

        bytes32 baseline;
        for (uint256 i; i < childCount; ++i) {
            bytes32 childHash = id(conditions, childStart + i);

            if (childHash == bytes32(0)) {
                continue;
            }

            if (baseline == bytes32(0)) {
                baseline = childHash;
            }

            if (baseline != childHash) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Computes a unique hash for a type tree structure
     */
    function id(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bytes32) {
        return hashTree(inspect(conditions, index));
    }

    /**
     * @notice Computes a unique hash for a Layout tree
     */
    function hashTree(Layout memory tree) private pure returns (bytes32) {
        Encoding encoding = tree.encoding == Encoding.EtherValue
            ? Encoding.None
            : tree.encoding;

        if (tree.children.length == 0) {
            return bytes32(uint256(encoding));
        }

        bytes32 hash = bytes32(uint256(encoding));
        for (uint256 i; i < tree.children.length; ++i) {
            bytes32 childHash = hashTree(tree.children[i]);
            if (childHash != bytes32(0)) {
                hash = keccak256(abi.encodePacked(hash, childHash));
            }
        }
        return hash;
    }

    function _isLogical(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        return
            conditions[index].operator == Operator.And ||
            conditions[index].operator == Operator.Or;
    }
}
