// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Types.sol";
import "../../AbiTypes.sol";

library Unpacker {
    // ═══════════════════════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════════════════════

    uint256 private constant CONDITION_HEADER_BYTES = 2;
    uint256 private constant CONDITION_NODE_BYTES = 4;
    uint256 private constant TYPETREE_HEADER_BYTES = 2;
    uint256 private constant TYPETREE_NODE_BYTES = 2;

    // ═══════════════════════════════════════════════════════════════════════════
    // Main Unpacking Function
    // ═══════════════════════════════════════════════════════════════════════════

    function unpack(
        bytes memory buffer
    )
        internal
        view
        returns (
            Condition memory condition,
            TypeTree memory typeTree,
            bytes32[] memory allowanceKeys
        )
    {
        // Read header offsets (2 × 16 bits = 4 bytes)
        uint256 typesOffset = _mload16(buffer, 0);
        uint256 allowanceOffset = _mload16(buffer, 2);

        // Unpack condition tree
        condition = _unpackCondition(buffer, 4);

        // Unpack type tree
        typeTree = _unpackTypeTree(buffer, typesOffset);

        assembly {
            allowanceKeys := add(buffer, add(0x20, allowanceOffset))
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Condition Unpacking
    // ═══════════════════════════════════════════════════════════════════════════

    function _unpackCondition(
        bytes memory buffer,
        uint256 offset
    ) internal view returns (Condition memory) {
        // Load the node count from header (16 bits)
        uint256 nodeCount;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            nodeCount := shr(240, mload(ptr))
        }

        offset += CONDITION_HEADER_BYTES;

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
                node.compValue = keccak256(abi.encode(_avatar()));
            }

            unchecked {
                offset += CONDITION_NODE_BYTES;
                ++i;
            }
        }

        // Return root node
        return nodes[0];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TypeTree Unpacking
    // ═══════════════════════════════════════════════════════════════════════════

    function _unpackTypeTree(
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (TypeTree memory) {
        // Load the node count from header (16 bits)
        uint256 nodeCount;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            nodeCount := shr(240, mload(ptr))
        }
        offset += TYPETREE_HEADER_BYTES;

        TypeTree[] memory nodes = new TypeTree[](nodeCount);
        uint256 nextChildIndex = 1;

        for (uint256 i = 0; i < nodeCount; ) {
            uint256 packed;
            assembly {
                let ptr := add(buffer, add(0x20, offset))
                packed := shr(240, mload(ptr))
            }

            TypeTree memory node = nodes[i];
            node._type = AbiType((packed >> 13) & 0x07);
            uint256 childCount = (packed >> 5) & 0xFF;

            if (childCount > 0) {
                node.children = new TypeTree[](childCount);

                for (uint256 j = 0; j < childCount; ) {
                    node.children[j] = nodes[nextChildIndex];
                    unchecked {
                        ++nextChildIndex;
                        ++j;
                    }
                }
            }

            unchecked {
                offset += TYPETREE_NODE_BYTES;
                ++i;
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
            let ptr := add(add(buffer, 0x20), offset)
            value := shr(240, mload(ptr))
        }
    }

    function _avatar() private view returns (address result) {
        assembly {
            result := sload(101)
        }
    }
}
