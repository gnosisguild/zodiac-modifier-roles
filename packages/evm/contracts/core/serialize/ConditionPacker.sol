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
        TopologyInfo[] memory topology
    ) internal pure returns (bytes memory buffer) {
        uint256 layoutOffset = 3 + _conditionPackedSize(conditions);
        (uint256 layoutNodeCount, uint8 maxPluckIndex) = _count(
            conditions,
            topology
        );

        buffer = new bytes(
            layoutOffset + 2 + layoutNodeCount * LAYOUT_NODE_BYTES
        );

        _packConditions(conditions, buffer, 3, topology);
        _packLayout(
            conditions,
            topology,
            buffer,
            layoutOffset,
            layoutNodeCount
        );

        // Header: layoutOffset (2 bytes) + maxPluckIndex (1 byte)
        buffer[0] = bytes1(uint8(layoutOffset >> 8));
        buffer[1] = bytes1(uint8(layoutOffset));
        buffer[2] = bytes1(maxPluckIndex);
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

    // ═══════════════════════════════════════════════════════════════════════════
    // Layout Packing
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Computes layoutNodeCount and maxPluckIndex in a single pass.
     */
    function _count(
        ConditionFlat[] memory conditions,
        TopologyInfo[] memory topology
    ) private pure returns (uint256 layoutNodeCount, uint8 maxPluckIndex) {
        for (uint256 i; i < conditions.length; ++i) {
            if (topology[i].layoutCount > 0) {
                layoutNodeCount++;
            }
            if (conditions[i].operator == Operator.Pluck) {
                uint8 pluckIndex = uint8(conditions[i].compValue[0]) + 1;
                if (pluckIndex > maxPluckIndex) {
                    maxPluckIndex = pluckIndex;
                }
            }
        }
    }

    /**
     * @dev Resolves through transparent (non-variant) And/Or chains to find
     *      the actual layout node that should be emitted.
     */
    function _resolveLayoutIndex(
        TopologyInfo[] memory topology,
        uint256 index
    ) private pure returns (uint256) {
        while (topology[index].layoutCount == 0) {
            index = topology[index].childStart;
        }
        return index;
    }

    /**
     * @dev Packs layout nodes directly from topology using BFS traversal,
     *      without intermediate Layout tree construction.
     */
    function _packLayout(
        ConditionFlat[] memory conditions,
        TopologyInfo[] memory topology,
        bytes memory buffer,
        uint256 offset,
        uint256 nodeCount
    ) private pure {
        offset += _packUInt16(nodeCount, buffer, offset);

        // BFS queue stores resolved condition indices
        uint256[] memory queue = new uint256[](nodeCount);
        uint256 head = 0;
        uint256 tail = 0;

        // Enqueue root (resolved through any transparent chains)
        queue[tail++] = _resolveLayoutIndex(topology, 0);

        while (head < tail) {
            uint256 idx = queue[head++];
            (uint24 packed, uint256 childCount) = _packLayoutNode(
                conditions,
                topology,
                idx
            );

            buffer[offset++] = bytes1(uint8(packed >> 16));
            buffer[offset++] = bytes1(uint8(packed >> 8));
            buffer[offset++] = bytes1(uint8(packed));

            // Enqueue children (resolved through transparent chains)
            uint256 childStart = topology[idx].childStart;
            for (uint256 i = 0; i < childCount; ++i) {
                queue[tail++] = _resolveLayoutIndex(topology, childStart + i);
            }
        }
    }

    /**
     * @dev Computes the packed 24-bit layout node and child count for a given index.
     */
    function _packLayoutNode(
        ConditionFlat[] memory conditions,
        TopologyInfo[] memory topology,
        uint256 idx
    ) private pure returns (uint24 packed, uint256 childCount) {
        Operator op = conditions[idx].operator;
        bool isLogical = op == Operator.And || op == Operator.Or;

        // Determine encoding (variant And/Or becomes Dynamic)
        Encoding encoding = isLogical
            ? Encoding.Dynamic
            : conditions[idx].paramType;

        // Extract leadingBytes for AbiEncoded
        uint256 leadingBytes;
        if (encoding == Encoding.AbiEncoded) {
            bytes memory compValue = conditions[idx].compValue;
            leadingBytes = compValue.length == 0
                ? 4
                : uint16(bytes2(compValue));
        }

        childCount = topology[idx].layoutCount - 1;

        // Pack node (3 bytes = 24 bits)
        packed =
            (uint24(encoding) << 21) |
            (topology[idx].atOffset ? uint24(0) : uint24(1 << 20)) |
            (uint24(childCount) << 12) |
            uint24(leadingBytes);
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
