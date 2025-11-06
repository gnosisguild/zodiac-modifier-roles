// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../AbiTypes.sol";
import "../packers/TypeTreeUnpacker.sol";

contract MockTypeTreeUnpacker {
    struct FlatNode {
        AbiType _type;
        uint256 parent;
    }

    function unpack(
        bytes memory buffer
    ) external pure returns (FlatNode[] memory result) {
        TypeTree memory root = TypeTreeUnpacker.unpack(buffer, 0);

        result = new FlatNode[](_countNodes(root));
        _flattenBFS(root, result);
    }

    function _flattenBFS(
        TypeTree memory root,
        FlatNode[] memory result
    ) private pure {
        // Create a queue for BFS traversal with parent tracking
        TypeTree[] memory queue = new TypeTree[](result.length);
        uint256[] memory parents = new uint256[](result.length);

        queue[0] = root;
        parents[0] = 0; // Root's parent is itself (or 0)

        uint256 head = 0;
        uint256 tail = 1;
        uint256 current = 0;

        while (head < tail) {
            TypeTree memory node = queue[head];
            uint256 parent = parents[head];
            head++;

            result[current] = FlatNode({_type: node._type, parent: parent});

            // enqueue children
            for (uint256 i = 0; i < node.children.length; ++i) {
                queue[tail] = node.children[i];
                parents[tail] = current; // parent index is current node
                tail++;
            }

            current++;
        }
    }

    function _countNodes(TypeTree memory root) private pure returns (uint256) {
        uint256 count = 1;
        for (uint256 i; i < root.children.length; i++) {
            count += _countNodes(root.children[i]);
        }
        return count;
    }
}
