// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

library ConditionUnpacker {
    // ═══════════════════════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════════════════════

    uint256 private constant CONDITION_NODE_BYTES = 5;
    uint256 private constant LAYOUT_NODE_BYTES = 3;

    // ═══════════════════════════════════════════════════════════════════════════
    // Main Unpacking Function
    // ═══════════════════════════════════════════════════════════════════════════

    function unpack(
        bytes memory buffer
    ) internal view returns (Condition memory condition, Layout memory layout) {
        // Read header offset (16 bits = 2 bytes)
        uint256 layoutOffset = _mload16(buffer, 0);

        // Unpack condition tree
        condition = _unpackCondition(buffer, 2);

        // Unpack layout
        layout = _unpackLayout(buffer, layoutOffset);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Condition Unpacking
    // ═══════════════════════════════════════════════════════════════════════════

    function _unpackCondition(
        bytes memory buffer,
        uint256 offset
    ) private view returns (Condition memory) {
        // Load the node count from header (16 bits)
        uint256 nodeCount;
        assembly {
            offset := add(0x20, add(buffer, offset))
            nodeCount := shr(240, mload(offset))
            offset := add(offset, 2)
        }

        Condition[] memory nodes = new Condition[](nodeCount);
        uint256 nextChildBFS = 1;

        for (uint256 i = 0; i < nodeCount; ++i) {
            uint256 packed;
            assembly {
                packed := shr(216, mload(offset)) // Load 5 bytes, 40 bits
            }

            /*
             * ┌───────────────────────────────────────────────────────────┐
             * │Each node 40 bits, 5 bytes:                                │
             * │  • operator              5 bits                           │
             * │  • unused                3 bits                           │
             * │  • childCount            8 bits  (0-255)                  │
             * │  • sChildCount           8 bits  (0-255)                  │
             * │  • compValueOffset      16 bits  (0 if no value)          │
             * └───────────────────────────────────────────────────────────┘
             */

            Condition memory node = nodes[i];
            node.operator = Operator((packed >> 35) & 0x1F);
            uint256 childCount = (packed >> 24) & 0xFF;
            node.sChildCount = (packed >> 16) & 0xFF;
            uint256 offsetCompValue = packed & 0xFFFF;

            if (offsetCompValue != 0) {
                uint256 length;
                assembly {
                    // load 2 bytes, 16 bits
                    length := shr(
                        240,
                        mload(add(0x20, add(buffer, offsetCompValue)))
                    )
                }

                bytes memory compValue = new bytes(length);
                assembly {
                    let src := add(0x22, add(buffer, offsetCompValue))
                    let dst := add(0x20, compValue)
                    mcopy(dst, src, length)
                }
                node.compValue = compValue;
            }

            if (childCount > 0) {
                node.children = new Condition[](childCount);
                for (uint256 j = 0; j < childCount; ++j) {
                    node.children[j] = nodes[nextChildBFS];
                    unchecked {
                        ++nextChildBFS;
                    }
                }
            } else if (node.operator == Operator.EqualToAvatar) {
                node.operator = Operator.EqualTo;
                node.compValue = abi.encodePacked(
                    keccak256(abi.encode(_avatar()))
                );
            }

            unchecked {
                offset += CONDITION_NODE_BYTES;
            }
        }

        // Return root node
        return nodes[0];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Layout Unpacking
    // ═══════════════════════════════════════════════════════════════════════════

    function _unpackLayout(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (Layout memory) {
        // Load the node count from header (16 bits)
        uint256 nodeCount;
        assembly {
            offset := add(0x20, add(buffer, offset))
            nodeCount := shr(240, mload(offset))
            offset := add(offset, 2)
        }

        Layout[] memory nodes = new Layout[](nodeCount);
        uint256 nextChildBFS = 1;

        for (uint256 i = 0; i < nodeCount; ++i) {
            uint256 packed;
            assembly {
                packed := shr(232, mload(offset)) // Load 3 bytes (24 bits)
            }
            /*
             * ┌──────────────────────────────────────────────────────────┐
             * │Each node (24 bits = 3 bytes):                            │
             * │  • encoding              3 bits  (bits 23-21)            │
             * │  • childCount            8 bits  (bits 20-13)            │
             * │  • leadingBytes         13 bits  (bits 12-0)             │
             * └──────────────────────────────────────────────────────────┘
             */

            Layout memory node = nodes[i];
            node.encoding = Encoding((packed >> 21) & 0x07);
            uint256 childCount = (packed >> 13) & 0xFF;
            node.leadingBytes = packed & 0x1FFF;

            if (childCount > 0) {
                node.children = new Layout[](childCount);

                for (uint256 j = 0; j < childCount; ++j) {
                    node.children[j] = nodes[nextChildBFS];
                    unchecked {
                        ++nextChildBFS;
                    }
                }
            }

            unchecked {
                offset += LAYOUT_NODE_BYTES;
            }
        }

        return nodes[0];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Helper Functions
    // ═══════════════════════════════════════════════════════════════════════════

    function _mload16(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256 value) {
        assembly {
            value := shr(240, mload(add(buffer, add(0x20, offset))))
        }
    }

    function _avatar() private view returns (address result) {
        assembly {
            result := sload(101)
        }
    }
}
