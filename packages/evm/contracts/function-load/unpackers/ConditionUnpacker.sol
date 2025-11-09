// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Types.sol";

library ConditionUnpacker {
    uint256 private constant BYTES_PER_HEADER = 2;
    uint256 private constant BYTES_PER_CONDITION = 4;

    function unpack(
        bytes memory buffer,
        uint256 offset
    ) internal view returns (Condition memory) {
        // Load the node count from header (16 bits)
        uint256 nodeCount;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            nodeCount := shr(240, mload(ptr))
        }

        offset += BYTES_PER_HEADER;

        Condition[] memory nodes = new Condition[](nodeCount);
        uint256 nextChildIndex = 1;

        for (uint256 i = 0; i < nodeCount; ) {
            uint256 packed;
            assembly {
                let ptr := add(buffer, add(0x20, offset))
                packed := shr(224, mload(ptr))
            }

            Condition memory node = nodes[i];

            // Extract fields:
            node.paramType = AbiType((packed >> 29) & 0x07);
            node.operator = Operator((packed >> 24) & 0x1F);
            uint256 childCount = (packed >> 16) & 0xFF;
            uint256 compValueOffset = packed & 0xFFFF;

            if (compValueOffset != 0) {
                bytes32 compValue;
                assembly {
                    let ptr := add(
                        buffer,
                        add(0x20, add(0x02, compValueOffset))
                    )
                    compValue := mload(ptr)
                }
                node.compValue = compValue;
            }

            if (childCount > 0) {
                node.children = new Condition[](childCount);
                for (uint256 j = 0; j < childCount; ) {
                    node.children[j] = nodes[nextChildIndex];
                    unchecked {
                        ++nextChildIndex;
                        ++j;
                    }
                }
            } else if (node.operator == Operator.EqualToAvatar) {
                node.operator = Operator.EqualTo;
                node.compValue = keccak256(abi.encode(avatar()));
            }

            unchecked {
                offset += BYTES_PER_CONDITION;
                ++i;
            }
        }

        // Return root node
        return nodes[0];
    }

    function avatar() private view returns (address result) {
        assembly {
            result := sload(101)
        }
    }
}
