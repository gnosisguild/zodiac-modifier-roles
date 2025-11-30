// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../../types/Types.sol";

/**
 * ScopedFunction Layout in Contract Storage
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ HEADER (2 bytes)                                                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ • layoutOffset             16 bits (0-65535)                        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ CONDITION TREE SECTION (at conditionTreeOffset)                     │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Header (2 bytes):                                                   │
 * │   • nodeCount              16 bits (0-65535)                        │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Nodes (nodeCount × 5 bytes each):                                   │
 * │   Each node (40 bits):                                              │
 * │     • operator              5 bits                                  │
 * │     • unused                3 bits                                  │
 * │     • childCount            8 bits  (0-255)                         │
 * │     • sChildCount           8 bits  (0-255)                         │
 * │     • compValueOffset      16 bits  (0 if no value)                 │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ CompValues (variable length):                                       │
 * │   For each condition with operator >= EqualTo:                      │
 * │     • length               16 bits  (compValue byte length)         │
 * │     • data                 N bytes  (actual compValue data)         │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ LAYOUT SECTION (at layoutOffset)                                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Header (2 bytes):                                                   │
 * │   • nodeCount              16 bits (0-65535)                        │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Nodes (nodeCount × 2 bytes each):                                   │
 * │   Each node (11 bits, padded to 2 bytes):                           │
 * │     • encoding              3 bits  (0-7)                           │
 * │     • childCount            8 bits  (0-255)                         │
 * │     • unused                5 bits                                  │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * NOTES:
 * - All offsets are relative to the start of the buffer
 * - Offsets are in bytes
 * - Children are implicitly sequential in BFS order (no childrenStart needed)
 */

library ConditionPacker {
    // ═══════════════════════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════════════════════

    uint256 private constant CONDITION_NODE_BYTES = 5;
    uint256 private constant LAYOUT_NODE_BYTES = 2;

    // ═══════════════════════════════════════════════════════════════════════════
    // Main Packing Function
    // ═══════════════════════════════════════════════════════════════════════════

    function pack(
        ConditionFlat[] memory conditions,
        Layout memory typeNode
    ) internal pure returns (bytes memory buffer) {
        uint256 size = 2 +
            _conditionPackedSize(conditions) +
            _layoutPackedSize(typeNode);

        buffer = new bytes(size);

        uint256 offset = 2;

        offset += _packConditions(conditions, buffer, offset);

        // pack at position 0 -> layoutOffset
        _packUInt16(offset, buffer, 0);
        _packLayout(typeNode, buffer, offset);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Condition Packing
    // ═══════════════════════════════════════════════════════════════════════════

    function _conditionPackedSize(
        ConditionFlat[] memory conditions
    ) internal pure returns (uint256 result) {
        uint256 count = conditions.length;

        // Header (2 bytes) + nodes
        result = 2 + count * CONDITION_NODE_BYTES;

        // Add space for compValues (variable length for operators >= EqualTo)
        for (uint256 i; i < count; ++i) {
            if (conditions[i].operator >= Operator.EqualTo) {
                // 2 bytes for length field
                result += 2;
                result += conditions[i].operator == Operator.EqualTo
                    ? 32 // keccak256 hash is always 32 bytes
                    : conditions[i].compValue.length;
            }
        }
    }

    function _packConditions(
        ConditionFlat[] memory conditions,
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (uint256) {
        uint256 startOffset = offset;

        offset += _packUInt16(conditions.length, buffer, offset);

        uint256 tailOffset = offset +
            (conditions.length * CONDITION_NODE_BYTES);

        for (uint256 i; i < conditions.length; ++i) {
            (, uint256 childCount, uint256 sChildCount) = _childBounds(
                conditions,
                i
            );

            // Pack Node
            {
                // byte 1: operator (5 bits) shifted left, 3 trailing unused bits
                buffer[offset++] = bytes1(uint8(conditions[i].operator) << 3);
                // byte 2
                buffer[offset++] = bytes1(uint8(childCount));
                // byte 3
                buffer[offset++] = bytes1(uint8(sChildCount));
                // todo encode a test with a high number of compValues, make sure both bytes on the tailOffset are considered
                // byte 4
                buffer[offset++] = bytes1(uint8(tailOffset >> 8));
                // byte 5
                buffer[offset++] = bytes1(uint8(tailOffset));
            }

            if (conditions[i].operator < Operator.EqualTo) {
                continue;
            }

            // Pack CompValue
            {
                bytes memory compValue = conditions[i].operator ==
                    Operator.EqualTo
                    ? abi.encodePacked(keccak256(conditions[i].compValue))
                    : conditions[i].compValue;

                uint256 length = compValue.length;
                buffer[tailOffset++] = bytes1(uint8(length >> 8));
                buffer[tailOffset++] = bytes1(uint8(length));

                assembly {
                    let src := add(0x20, compValue)
                    let dst := add(add(0x20, buffer), tailOffset)
                    mcopy(dst, src, length)
                }
                tailOffset += length;
            }
        }
        return tailOffset - startOffset;
    }

    function _childBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    )
        private
        pure
        returns (uint256 childStart, uint256 childCount, uint256 sChildCount)
    {
        for (uint256 i = index + 1; i < conditions.length; ++i) {
            uint256 parent = conditions[i].parent;

            if (parent == index) {
                if (childCount == 0) childStart = i;
                ++childCount;
            } else if (parent > index) {
                break;
            }
        }

        sChildCount = childCount;
        for (uint256 i = childStart + childCount; i > childStart; --i) {
            if (_isNonStructural(conditions, i - 1)) {
                // non structural come last
                --sChildCount;
            } else {
                // break once structural, all the rest will also be
                break;
            }
        }
    }

    function _isNonStructural(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        // NonStructural if paramType is None and all descendants are None
        if (conditions[index].paramType != Encoding.None) {
            return false;
        }

        for (uint256 i = index + 1; i < conditions.length; ++i) {
            if (conditions[i].parent == index) {
                if (!_isNonStructural(conditions, i)) {
                    return false;
                }
            } else if (conditions[i].parent > index) {
                break;
            }
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Layout Packing
    // ═══════════════════════════════════════════════════════════════════════════

    function _layoutPackedSize(
        Layout memory node
    ) internal pure returns (uint256 result) {
        // Header (2 bytes) + all nodes (2 bytes each)
        result = 2 + _countNodes(node) * LAYOUT_NODE_BYTES;
    }

    function _packLayout(
        Layout memory tree,
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (uint256) {
        LayoutNodeFlat[] memory nodes = _flattenLayout(tree);

        offset += _packUInt16(nodes.length, buffer, offset);

        // Pack all nodes (2 bytes each)
        for (uint256 i; i < nodes.length; ++i) {
            uint16 packed = (uint16(nodes[i].encoding) << 13) |
                (uint16(nodes[i].childCount) << 5);

            buffer[offset++] = bytes1(uint8(packed >> 8));
            buffer[offset++] = bytes1(uint8(packed));
        }

        return 2 + nodes.length * LAYOUT_NODE_BYTES;
    }

    function _flattenLayout(
        Layout memory root
    ) internal pure returns (LayoutNodeFlat[] memory) {
        uint256 total = _countNodes(root);
        LayoutNodeFlat[] memory result = new LayoutNodeFlat[](total);

        Layout[] memory queue = new Layout[](total);
        uint256[] memory parents = new uint256[](total);

        queue[0] = root;
        parents[0] = 0;

        uint256 head = 0;
        uint256 tail = 1;
        uint256 current = 0;

        while (head < tail) {
            Layout memory node = queue[head];
            uint256 parent = parents[head];
            head++;

            // Record this node
            result[current] = LayoutNodeFlat({
                encoding: node.encoding,
                parent: parent,
                childCount: node.children.length
            });

            // Enqueue children
            for (uint256 i = 0; i < node.children.length; ++i) {
                queue[tail] = node.children[i];
                parents[tail] = current;
                tail++;
            }

            current++;
        }

        return result;
    }

    function _countNodes(
        Layout memory node
    ) internal pure returns (uint256 count) {
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += _countNodes(node.children[i]);
        }
    }

    struct LayoutNodeFlat {
        uint256 parent;
        Encoding encoding;
        uint256 childCount;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Buffer Helpers
    // ═══════════════════════════════════════════════════════════════════════════

    function _packUInt16(
        uint256 value,
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256) {
        assert(value < type(uint16).max);

        buffer[offset] = bytes1(uint8((value >> 8)));
        buffer[offset + 1] = bytes1(uint8((value)));

        return 2;
    }
}
