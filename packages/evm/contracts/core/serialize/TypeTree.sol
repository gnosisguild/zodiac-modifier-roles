// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";

import "../../types/Types.sol";

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
     * @notice Extracts type tree for flat node at index
     */
    function inspect(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (Layout memory node) {
        bool isLogical = _isLogical(conditions, index);
        bool isVariant = _isVariant(conditions, index);

        /*
         * Type trees only include structural children
         */
        (uint256 childStart, , uint256 sChildCount) = Topology.childBounds(
            conditions,
            index
        );

        /*
         * Non-variant logical nodes: first child defines the type tree,
         * others have the same structure and don't influence the result
         */
        if (isLogical && !isVariant) {
            return inspect(conditions, childStart);
        }

        /*
         * Nodes that are Logical and Variant use Dynamic as a container to
         * indicate the variant. All other nodes use their declared paramType
         */
        node.encoding = (isLogical && isVariant)
            ? Encoding.Dynamic
            : conditions[index].paramType;

        /*
         * For non-variant arrays, the first child serves as a template for
         * all elements. For all other nodes, traverse all structural children
         */
        node.children = new Layout[](
            node.encoding == Encoding.Array && !isVariant ? 1 : sChildCount
        );

        for (uint256 i = 0; i < node.children.length; ++i) {
            node.children[i] = inspect(conditions, childStart + i);
        }

        /*
         * For AbiEncoded: extract leadingBytes from compValue (2 bytes).
         * If compValue is empty, default to 4 (function selector size).
         */
        if (node.encoding == Encoding.AbiEncoded) {
            bytes memory compValue = conditions[index].compValue;
            node.leadingBytes = compValue.length == 0
                ? 4
                : uint16(bytes2(compValue));
        }

        node.inlined = _isInlined(conditions, index);
    }

    /**
     * @notice Computes a unique hash for a type tree structure
     */
    function id(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bytes32) {
        return _hashTree(inspect(conditions, index));
    }

    function _isLogical(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        return
            conditions[index].operator == Operator.And ||
            conditions[index].operator == Operator.Or;
    }

    function _isVariant(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        bool isArray = conditions[index].paramType == Encoding.Array;
        bool isLogical = _isLogical(conditions, index);

        if (!isArray && !isLogical) {
            return false;
        }

        (uint256 childStart, , uint256 sChildCount) = Topology.childBounds(
            conditions,
            index
        );
        if (sChildCount <= 1) return false;

        bytes32 idHash = id(conditions, childStart);
        for (uint256 i = 1; i < sChildCount; ++i) {
            if (idHash != id(conditions, childStart + i)) return true;
        }

        return false;
    }

    function _isInlined(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        Encoding encoding = conditions[index].paramType;
        if (
            encoding == Encoding.Dynamic ||
            encoding == Encoding.Array ||
            encoding == Encoding.AbiEncoded
        ) {
            return false;
        }

        for (uint256 i = index + 1; i < conditions.length; ++i) {
            uint256 parent = conditions[i].parent;
            if (parent == index && !_isInlined(conditions, i)) {
                return false;
            } else if (parent > index) {
                break;
            }
        }
        return true;
    }

    function _hashTree(Layout memory tree) private pure returns (bytes32) {
        if (tree.children.length == 0) {
            return bytes32(uint256(tree.encoding));
        }

        bytes32[] memory childHashes = new bytes32[](tree.children.length);
        for (uint256 i = 0; i < tree.children.length; i++) {
            childHashes[i] = _hashTree(tree.children[i]);
        }

        return
            keccak256(
                abi.encodePacked(bytes32(uint256(tree.encoding)), childHashes)
            );
    }
}
