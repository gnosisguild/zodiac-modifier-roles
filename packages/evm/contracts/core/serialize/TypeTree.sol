// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Condition.sol";
import "../../types/Topology.sol";

/**
 * @title  TypeTree
 * @notice Extracts type trees from flat conditions for use in decoding.
 *         Uses Topology for all pre-computed data.
 *
 * @author gnosisguild
 */
library TypeTree {
    function resolve(
        ConditionFlat[] memory conditions,
        TopologyInfo[] memory info,
        uint256 index
    ) internal pure returns (Layout memory node) {
        bool isLogical = conditions[index].operator == Operator.Or ||
            conditions[index].operator == Operator.And;
        bool isVariant = info[index].isVariant;
        uint256 childStart = info[index].childStart;
        uint256 sChildCount = info[index].sChildCount;

        /*
         * Non-variant logical nodes: first child defines the type tree,
         * others have the same structure and don't influence the result
         */
        if (isLogical && !isVariant) {
            return resolve(conditions, info, childStart);
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
            node.children[i] = resolve(conditions, info, childStart + i);
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

        node.inlined = !info[index].atOffset;
    }
}
