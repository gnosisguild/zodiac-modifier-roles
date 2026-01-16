// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";

/**
 * ScopedFunction Layout in Contract Storage
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ HEADER (3 bytes)                                                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ • layoutOffset             16 bits (0-65535)                        │
 * │ • maxPluckIndex             8 bits (0-255)                          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ CONDITION TREE (at conditionTreeOffset)                             │
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
 * │ LAYOUT TREE (at layoutOffset)                                       │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Header (2 bytes):                                                   │
 * │   • nodeCount              16 bits (0-65535)                        │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Nodes (nodeCount × 3 bytes each):                                   │
 * │   Each node (24 bits = 3 bytes):                                    │
 * │     • encoding              3 bits                                  │
 * │     • inlined               1 bit                                   │
 * │     • childCount            8 bits                                  │
 * │     • leadingBytes         12 bits                                  │
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
    uint256 private constant LAYOUT_NODE_BYTES = 3;

    // ═══════════════════════════════════════════════════════════════════════════
    // Main Packing Function
    // ═══════════════════════════════════════════════════════════════════════════

    function pack(
        ConditionFlat[] memory conditions,
        Layout memory layout,
        TopologyInfo[] memory topology
    ) internal pure returns (bytes memory buffer) {
        uint256 layoutOffset = 3 + _conditionPackedSize(conditions);

        buffer = new bytes(layoutOffset + _layoutPackedSize(layout));

        _packConditions(conditions, buffer, 3, topology);
        _packLayout(layout, buffer, layoutOffset);

        // Header: layoutOffset (2 bytes) + maxPluckIndex (1 byte)
        buffer[0] = bytes1(uint8(layoutOffset >> 8));
        buffer[1] = bytes1(uint8(layoutOffset));
        buffer[2] = bytes1(_pluckValuesMaxCount(conditions));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Condition Packing
    // ═══════════════════════════════════════════════════════════════════════════

    function _conditionPackedSize(
        ConditionFlat[] memory conditions
    ) private pure returns (uint256 result) {
        uint256 count = conditions.length;

        // Header (2 bytes) + nodes
        result = 2 + count * CONDITION_NODE_BYTES;

        // Add space for compValues
        for (uint256 i; i < count; ++i) {
            if (!_hasCompValue(conditions[i])) continue;

            // 2 bytes for length field
            result += 2;

            if (conditions[i].paramType == Encoding.AbiEncoded) {
                result += conditions[i].compValue.length - 2; // skip leadingBytes
            } else if (
                conditions[i].operator == Operator.EqualTo &&
                conditions[i].compValue.length > 32
            ) {
                result += 32; // store keccak256 hash
            } else {
                result += conditions[i].compValue.length;
            }
        }
    }

    function _packConditions(
        ConditionFlat[] memory conditions,
        bytes memory buffer,
        uint256 offset,
        TopologyInfo[] memory topology
    ) private pure {
        offset += _packUInt16(conditions.length, buffer, offset);

        uint256 tailOffset = offset +
            (conditions.length * CONDITION_NODE_BYTES);

        for (uint256 i; i < conditions.length; ++i) {
            uint256 childCount = topology[i].childCount;
            uint256 sChildCount = topology[i].sChildCount;

            ConditionFlat memory condition = conditions[i];
            bool hasCompValue = _hasCompValue(condition);

            // Pack Node
            {
                // byte 1: operator (5 bits) shifted left, 3 trailing unused bits
                buffer[offset++] = bytes1(uint8(conditions[i].operator) << 3);
                // byte 2
                buffer[offset++] = bytes1(uint8(childCount));
                // byte 3
                buffer[offset++] = bytes1(uint8(sChildCount));

                // bytes 4-5: compValueOffset (0 if no compValue)
                buffer[offset++] = hasCompValue
                    ? bytes1(uint8(tailOffset >> 8))
                    : bytes1(0);
                buffer[offset++] = hasCompValue
                    ? bytes1(uint8(tailOffset))
                    : bytes1(0);

                // todo encode a test with a high number of compValues, make sure both bytes on the tailOffset are considered
            }

            if (!hasCompValue) continue;

            // Pack CompValue - three cases:
            // 1. AbiEncoded match bytes: store N bytes (skip first 2 bytes of compValue)
            // 2. EqualTo with >32 bytes: store keccak256 hash (32 bytes)
            // 3. Other comparisons: store compValue as-is
            bytes memory compValue = condition.compValue;
            uint256 length;
            uint256 srcOffset;
            if (condition.paramType == Encoding.AbiEncoded) {
                length = compValue.length - 2;
                srcOffset = 2; // skip leadingBytes
            } else if (
                condition.operator == Operator.EqualTo && compValue.length > 32
            ) {
                compValue = abi.encodePacked(keccak256(compValue));
                length = 32;
                srcOffset = 0;
            } else {
                length = compValue.length;
                srcOffset = 0;
            }

            buffer[tailOffset++] = bytes1(uint8(length >> 8));
            buffer[tailOffset++] = bytes1(uint8(length));

            assembly {
                let src := add(add(0x20, compValue), srcOffset)
                let dst := add(add(0x20, buffer), tailOffset)
                mcopy(dst, src, length)
            }
            tailOffset += length;
        }
    }

    function _hasCompValue(
        ConditionFlat memory condition
    ) private pure returns (bool) {
        return
            condition.operator >= Operator.EqualTo ||
            condition.operator == Operator.Slice ||
            condition.operator == Operator.Pluck ||
            (condition.paramType == Encoding.AbiEncoded &&
                condition.compValue.length > 2);
    }

    function _pluckValuesMaxCount(
        ConditionFlat[] memory conditions
    ) private pure returns (uint8 result) {
        for (uint256 i = 0; i < conditions.length; ++i) {
            if (conditions[i].operator != Operator.Pluck) continue;

            uint8 count = uint8(conditions[i].compValue[0]) + 1;
            if (count > result) {
                result = count;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Layout Packing
    // ═══════════════════════════════════════════════════════════════════════════

    function _layoutPackedSize(
        Layout memory node
    ) private pure returns (uint256 result) {
        // Header (2 bytes) + all nodes (3 bytes each)
        result = 2 + _countNodes(node) * LAYOUT_NODE_BYTES;
    }

    function _packLayout(
        Layout memory tree,
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256) {
        LayoutNodeFlat[] memory nodes = _flattenLayout(tree);

        offset += _packUInt16(nodes.length, buffer, offset);

        // Pack all nodes (3 bytes each)
        for (uint256 i; i < nodes.length; ++i) {
            uint24 packed = (uint24(nodes[i].encoding) << 21) |
                (nodes[i].inlined ? uint24(1 << 20) : uint24(0)) |
                (uint24(nodes[i].childCount) << 12) |
                uint24(nodes[i].leadingBytes);

            buffer[offset++] = bytes1(uint8(packed >> 16));
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
                childCount: node.children.length,
                leadingBytes: uint16(node.leadingBytes),
                inlined: node.inlined
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
        uint16 leadingBytes;
        bool inlined;
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
