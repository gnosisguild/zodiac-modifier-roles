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
     * @notice Resolves type tree for condition at an index
     */
    function resolve(
        ConditionFlat[] memory conditions,
        uint256 i
    ) internal pure returns (Layout memory layout) {
        bool isArray = conditions[i].paramType == Encoding.Array;
        bool isLogical = conditions[i].operator == Operator.And ||
            conditions[i].operator == Operator.Or;
        bool isNonVariant = isVariant(conditions, i) == false;

        (uint256 childStart, uint256 childCount) = Topology.childBounds(
            conditions,
            i
        );

        if (isLogical && isNonVariant) {
            /*
             * Non-variant logical nodes: first structural child defines the type tree
             */
            for (uint256 j; j < childCount; ++j) {
                if (hash(conditions, childStart + j) != bytes32(0)) {
                    return resolve(conditions, childStart + j);
                }
            }

            /*
             * No structural child was found.
             */
            Layout memory none;
            return none;
        }

        layout.encoding = conditions[i].paramType == Encoding.EtherValue
            ? Encoding.None
            : conditions[i].paramType;

        /*
         * Extract leadingBytes for AbiEncoded from compValue, first 2 bytes
         * Default is 4 (selector size) when compValue is empty
         */
        if (layout.encoding == Encoding.AbiEncoded) {
            bytes memory compValue = conditions[i].compValue;
            layout.leadingBytes = compValue.length >= 2
                ? uint16(bytes2(compValue))
                : 4;
        }

        layout.children = new Layout[](childCount);

        uint256 length;
        for (uint256 j; j < layout.children.length; ++j) {
            if (hash(conditions, childStart + j) != bytes32(0)) {
                layout.children[length++] = resolve(conditions, childStart + j);

                /*
                 * For non-variant arrays, the first child serves as a template for
                 * all elements. For all other nodes, traverse all structural children
                 */
                if (isArray && isNonVariant) {
                    break;
                }
            }
        }
        assembly {
            // layout.children is at offset 0x20 (second field)
            mstore(mload(add(layout, 0x20)), length)
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
            bytes32 childHash = hash(conditions, childStart + i);

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
    function hash(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (bytes32) {
        return hash(resolve(conditions, index));
    }

    /**
     * @notice Computes a unique hash for a Layout tree
     */
    function hash(Layout memory tree) internal pure returns (bytes32 result) {
        Encoding encoding = tree.encoding == Encoding.EtherValue
            ? Encoding.None
            : tree.encoding;

        if (tree.children.length == 0) {
            return bytes32(uint256(encoding));
        }

        result = bytes32(uint256(encoding));
        for (uint256 i; i < tree.children.length; ++i) {
            bytes32 childHash = hash(tree.children[i]);
            if (childHash != bytes32(0)) {
                result = keccak256(abi.encodePacked(result, childHash));
            }
        }
    }
}
