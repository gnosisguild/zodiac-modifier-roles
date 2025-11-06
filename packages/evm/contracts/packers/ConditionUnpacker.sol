// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

library ConditionUnpacker {
    uint256 private constant BYTES_PER_HEADER = 2;
    uint256 private constant BYTES_PER_CONDITION = 4;

    function unpack(
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (Condition memory condition) {
        // Load the node count from header (16 bits)
        uint256 nodeCount;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            nodeCount := shr(240, mload(ptr))
        }

        if (nodeCount == 0) return condition;

        uint256 conditionsOffset = offset + BYTES_PER_HEADER;

        // Create all nodes in an array
        Condition[] memory nodes = new Condition[](nodeCount);

        // First pass: read all nodes and allocate children arrays
        for (uint256 i = 0; i < nodeCount; ) {
            uint256 nodeOffset = conditionsOffset + (i * BYTES_PER_CONDITION);

            // Read 4 bytes and align right in 256-bit word
            uint256 word;
            assembly {
                let ptr := add(add(buffer, 0x20), nodeOffset)
                word := shr(224, mload(ptr))
            }

            // Extract fields:
            uint256 paramType = (word >> 29) & 0x07;
            uint256 operator = (word >> 24) & 0x1F;
            uint256 childCount = (word >> 16) & 0xFF;
            uint256 compValueOffset = word & 0xFFFF;

            nodes[i].paramType = AbiType(paramType);
            nodes[i].operator = Operator(operator);

            // Get compValue if this operator needs one
            if (
                Operator(operator) >= Operator.EqualTo && compValueOffset != 0
            ) {
                // for now we jump over the count and just load 32 bytes
                bytes32 compValue;
                assembly {
                    let ptr := add(
                        add(buffer, 0x20),
                        add(compValueOffset, 0x02)
                    )
                    compValue := mload(ptr)
                }
                nodes[i].compValue = compValue;
            }

            if (childCount > 0) {
                nodes[i].children = new Condition[](childCount);
            }

            unchecked {
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

        // Return root node
        condition = nodes[0];
    }
}
