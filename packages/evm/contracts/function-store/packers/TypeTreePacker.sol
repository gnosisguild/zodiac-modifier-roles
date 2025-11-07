// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../AbiTypes.sol";

library TypeTreePacker {
    uint256 private constant BYTES_COUNT_ENCODING = 2;
    uint256 private constant BYTES_NODE_BODY = 2;

    struct FlatNode {
        uint256 parent;
        AbiType _type;
        uint256 childCount;
    }

    function pack(
        TypeTree memory tree,
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (uint256) {
        FlatNode[] memory nodes = flattenBFS(tree);

        // Write header: [6 bits nodeCount]
        uint256 childCount = nodes.length;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            mstore(ptr, shl(240, childCount))
        }
        offset += BYTES_COUNT_ENCODING;

        // Pack all nodes (2 bytes each)
        for (uint256 i; i < nodes.length; ) {
            // Pack 16 bits:
            // Bits 0-2: type (3 bits)
            // Bits 3-10: childCount (8 bits)
            // Bits 11-15: reserved (5 bits)
            uint256 mask = ~(uint256(0xFFFFFFFF) << 240);
            uint256 packed = ((uint256(nodes[i]._type) << 13) |
                ((nodes[i].childCount & 0xFF) << 5)) << 240;

            // Write 2 bytes
            assembly {
                let ptr := add(buffer, add(0x20, offset))
                let existing := mload(ptr)
                existing := and(existing, mask)
                mstore(ptr, or(packed, existing))
            }

            unchecked {
                offset += BYTES_NODE_BODY;
                ++i;
            }
        }

        return BYTES_COUNT_ENCODING + nodes.length * BYTES_NODE_BODY;
    }

    function packedSize(
        TypeTree memory node
    ) internal pure returns (uint256 result) {
        // Header (2 bytes)
        result = BYTES_COUNT_ENCODING;

        // All nodes (2 bytes each)
        result += countNodes(node) * BYTES_NODE_BODY;
    }

    function flattenBFS(
        TypeTree memory root
    ) internal pure returns (FlatNode[] memory) {
        uint256 total = countNodes(root);
        FlatNode[] memory result = new FlatNode[](total);

        TypeTree[] memory queue = new TypeTree[](total);
        uint256[] memory parents = new uint256[](total);

        queue[0] = root;
        parents[0] = 0;

        uint256 head = 0;
        uint256 tail = 1;
        uint256 current = 0;

        while (head < tail) {
            TypeTree memory node = queue[head];
            uint256 parent = parents[head];
            head++;

            // record this node
            result[current] = FlatNode({
                _type: node._type,
                parent: parent,
                childCount: node.children.length
            });

            // enqueue children
            for (uint256 i = 0; i < node.children.length; ++i) {
                queue[tail] = node.children[i];
                parents[tail] = current; // parent index is current node
                tail++;
            }

            current++;
        }

        return result;
    }

    function countNodes(
        TypeTree memory node
    ) internal pure returns (uint256 count) {
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += countNodes(node.children[i]);
        }
    }
}
