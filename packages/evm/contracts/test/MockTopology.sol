// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Topology.sol";

import "../Topology2.sol";

contract MockTopology {
    function typeTree(
        ConditionFlat[] memory conditions
    ) public pure returns (AbiTypeTree[] memory result) {
        return
            Topology.typeTree(
                conditions,
                0,
                Topology.childrenBounds(conditions)
            );
    }

    function typeTreeAt(
        ConditionFlat[] memory conditions,
        uint256 entrypoint
    ) public pure returns (AbiTypeTree[] memory result) {
        return
            Topology.typeTree(
                conditions,
                entrypoint,
                Topology.childrenBounds(conditions)
            );
    }

    function typeTree2(
        ConditionFlat[] memory conditions
    ) public pure returns (FlatNode[] memory result) {
        return flattenTree(Topology2.typeTree(conditions, 0));
    }

    // Flat structure with parent reference
    struct FlatNode {
        uint256 parent;
        AbiType _type;
    }

    // Queue item for BFS
    struct QueueItem {
        uint256 parent;
        Topology2.Result node;
    }

    function flattenTree(
        Topology2.Result memory root
    ) internal pure returns (FlatNode[] memory result) {
        // Count nodes first to allocate array
        uint256 totalNodes = countNodes(root);
        if (totalNodes == 0) {
            return result;
        }

        result = new FlatNode[](totalNodes);

        // Manual queue implementation for BFS
        QueueItem[] memory queue = new QueueItem[](totalNodes);
        uint256 queueStart = 0;
        uint256 queueEnd = 0;
        uint256 resultIndex = 0;

        // Add root to queue
        queue[queueEnd++] = QueueItem({parent: 0, node: root});

        // Process queue (BFS)
        while (queueStart < queueEnd) {
            QueueItem memory current = queue[queueStart++];

            // Add current node to result
            result[resultIndex] = FlatNode({
                _type: current.node._type,
                parent: current.parent
            });

            // Add children to queue
            uint256 currentNodeIndex = resultIndex;
            for (uint256 i = 0; i < current.node.children.length; i++) {
                queue[queueEnd++] = QueueItem({
                    node: current.node.children[i],
                    parent: currentNodeIndex
                });
            }

            resultIndex++;
        }

        return result;
    }

    // Recursive helper to count nodes
    function countNodes(
        Topology2.Result memory tree
    ) private pure returns (uint256) {
        uint256 count;

        for (uint256 i = 0; i < tree.children.length; i++) {
            count += countNodes(tree.children[i]);
        }

        return count + 1;
    }
}
