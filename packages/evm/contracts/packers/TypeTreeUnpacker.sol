// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../AbiTypes.sol";

library TypeTreeUnpacker {
    uint256 private constant BYTES_PER_HEADER = 2;
    uint256 private constant BYTES_PER_NODE = 2;

    function unpack(
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (TypeTree memory) {
        // Load the node count from header (16 bits)
        uint256 nodeCount;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            nodeCount := shr(240, mload(ptr))
        }

        offset += BYTES_PER_HEADER;

        TypeTree[] memory nodes = new TypeTree[](nodeCount);

        // First pass: read all nodes and allocate children arrays
        for (uint256 i = 0; i < nodeCount; ) {
            // Read and unpack the 2-byte node (16 bits)
            uint256 packed;
            assembly {
                let ptr := add(buffer, add(0x20, offset))
                packed := shr(240, mload(ptr))
            }

            nodes[i]._type = AbiType((packed >> 13) & 0x07);
            uint256 childCount = (packed >> 5) & 0xFF;

            if (childCount > 0) {
                nodes[i].children = new TypeTree[](childCount);
            }

            unchecked {
                offset += BYTES_PER_NODE;
                ++i;
            }
        }

        // Second pass: populate children by reference (left-to-right order)
        // Children are stored consecutively in the buffer after their parent
        uint256 nextChildIndex = 1;
        for (uint256 i = 0; i < nodeCount; ) {
            uint256 childCount = nodes[i].children.length;

            for (uint256 j = 0; j < childCount; ) {
                nodes[i].children[j] = nodes[nextChildIndex];
                nextChildIndex++;

                unchecked {
                    ++j;
                }
            }

            unchecked {
                ++i;
            }
        }

        return nodes[0];
    }
}
