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
 * │ • maxPluckCount             8 bits (0-255)                          │
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
        Topology[] memory topology
    ) internal pure returns (bytes memory buffer) {
        (uint256 layoutNodeCount, uint256 maxPluckCount) = _count(
            conditions,
            topology
        );

        uint256 layoutOffset = 3 + _conditionPackedSize(conditions);

        buffer = new bytes(
            layoutOffset + 2 + layoutNodeCount * LAYOUT_NODE_BYTES
        );

        // Header: layoutOffset (2 bytes) + maxPluckCount (1 byte)
        uint256 header = (layoutOffset << 8) | maxPluckCount;
        assembly {
            mstore(add(buffer, 0x20), shl(232, header))
        }

        _packConditions(conditions, buffer, 3, topology);
        if (layoutNodeCount > 0) {
            _packLayout(
                conditions,
                topology,
                buffer,
                layoutOffset,
                layoutNodeCount
            );
        }
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
            ConditionFlat memory condition = conditions[i];

            bool hasCompValue = condition.compValue.length >
                (condition.paramType == Encoding.AbiEncoded ? 2 : 0);

            if (!hasCompValue) continue;

            // 2 bytes for length field
            result += 2;

            if (condition.paramType == Encoding.AbiEncoded) {
                result += condition.compValue.length - 2; // skip leadingBytes
            } else if (
                condition.operator == Operator.EqualTo &&
                condition.compValue.length > 32
            ) {
                result += 32; // store keccak256 hash
            } else {
                result += condition.compValue.length;
            }
        }
    }

    function _packConditions(
        ConditionFlat[] memory conditions,
        bytes memory buffer,
        uint256 offset,
        Topology[] memory topology
    ) private pure {
        offset += _packUInt16(conditions.length, buffer, offset);

        uint256 tailOffset = offset +
            (conditions.length * CONDITION_NODE_BYTES);

        uint256 length = conditions.length;
        for (uint256 i; i < length; ++i) {
            ConditionFlat memory condition = conditions[i];
            Operator operator = condition.operator;

            uint256 childCount = topology[i].childCount;
            uint256 sChildCount = topology[i].sChildCount;

            bool hasCompValue = condition.compValue.length >
                (condition.paramType == Encoding.AbiEncoded ? 2 : 0);

            // Pack Node
            {
                /*
                 * Condition Node (5 bytes, 40 bits):
                 * ┌──────────┬────────┬────────────┬─────────────┬─────────────────┐
                 * │ operator │ unused │ childCount │ sChildCount │ compValueOffset │
                 * │  5 bits  │ 3 bits │   8 bits   │   8 bits    │    16 bits      │
                 * └──────────┴────────┴────────────┴─────────────┴─────────────────┘
                 *
                 */
                uint256 packed = (uint256(operator) << 35) |
                    (childCount << 24) |
                    (sChildCount << 16) |
                    (hasCompValue ? tailOffset : 0);

                /*
                 * The or with mload preserves bytes 5-31 (compValues written in
                 * previous iterations) while writing our 5 bytes at positions 0-4.
                 */
                assembly {
                    let ptr := add(add(buffer, 0x20), offset)
                    mstore(ptr, or(mload(ptr), shl(216, packed)))
                }
                offset += 5;
            }

            if (!hasCompValue) continue;

            // Pack CompValue:
            // 1. AbiEncoded: skip first 2 bytes
            // 2. EqualTo: hash greater than 32 bytes
            {
                bytes memory compValue = condition.compValue;
                uint256 compValueLength = compValue.length;
                uint256 srcOffset;
                if (condition.paramType == Encoding.AbiEncoded) {
                    compValueLength -= 2;
                    srcOffset = 2; // skip leadingBytes
                } else if (
                    operator == Operator.EqualTo && compValueLength > 32
                ) {
                    compValue = abi.encodePacked(keccak256(compValue));
                    compValueLength = 32;
                }

                /*
                 * Writing at tail, so mstore's 30 zero bytes after the 2-byte
                 * length are safe - they get overwritten by mcopy or are past
                 * the buffer's used region.
                 */
                assembly {
                    let ptr := add(add(buffer, 0x20), tailOffset)
                    mstore(ptr, shl(240, compValueLength))
                    mcopy(
                        add(ptr, 2),
                        add(add(compValue, 0x20), srcOffset),
                        compValueLength
                    )
                }
                tailOffset += 2 + compValueLength;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Layout Packing
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Packs layout nodes. Nodes are already in BFS order, so we emit
     *      those with isInLayout=true. Variant logical nodes use Dynamic
     *      encoding; non-variant arrays use a single child as template.
     */
    function _packLayout(
        ConditionFlat[] memory conditions,
        Topology[] memory topology,
        bytes memory buffer,
        uint256 offset,
        uint256 nodeCount
    ) private pure {
        offset += _packUInt16(nodeCount, buffer, offset);

        uint256 length = conditions.length;
        for (uint256 i; i < length; ++i) {
            Topology memory t = topology[i];

            if (!t.isInLayout) continue;

            ConditionFlat memory condition = conditions[i];

            // a logic here means variant container
            Encoding encoding = (condition.operator == Operator.And ||
                condition.operator == Operator.Or)
                ? Encoding.Dynamic
                : condition.paramType;

            uint256 leadingBytes = encoding == Encoding.AbiEncoded
                ? (
                    condition.compValue.length == 0
                        ? 4
                        : uint16(bytes2(condition.compValue))
                )
                : 0;

            uint256 childCount = encoding == Encoding.Array && !t.isVariant
                ? 1
                : t.sChildCount;

            /*
             * Layout Node (3 bytes, 24 bits):
             * ┌──────────┬────────┬────────────┬──────────────┐
             * │ encoding │ inline │ childCount │ leadingBytes │
             * │  3 bits  │ 1 bit  │   8 bits   │   12 bits    │
             * └──────────┴────────┴────────────┴──────────────┘
             */
            uint256 packed = (uint256(encoding) << 21) |
                (t.isNotInline ? 0 : (1 << 20)) |
                (childCount << 12) |
                leadingBytes;

            assembly {
                let ptr := add(add(buffer, 0x20), offset)
                mstore(ptr, shl(232, packed))
            }
            offset += 3;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Computes layoutNodeCount and maxPluckCount in a single pass.
     */
    function _count(
        ConditionFlat[] memory conditions,
        Topology[] memory topology
    ) private pure returns (uint256 layoutNodeCount, uint256 maxPluckCount) {
        uint256 length = conditions.length;
        for (uint256 i; i < length; ++i) {
            if (topology[i].isInLayout) {
                ++layoutNodeCount;
            }
            if (conditions[i].operator == Operator.Pluck) {
                uint8 pluckIndex = uint8(conditions[i].compValue[0]);
                if (pluckIndex + 1 > maxPluckCount) {
                    maxPluckCount = pluckIndex + 1;
                }
            }
        }
    }

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
