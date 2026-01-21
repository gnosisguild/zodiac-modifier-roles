// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";

/**
 * @title  ConditionPacker
 * @notice A library that provides packing functions for conditions,
 *         transforming ConditionsFlat[] into a memory-optimized buffer.
 *
 * @dev    This library is NOT gas-sensitive since packing is intended to be
 *         called as a helper function within a view entrypoint.
 *
 * @author gnosisguild
 *
 * ╔════════════════════════════════ BUFFER ═════════════════════════════════╗
 * ║ ┌─────────────────────────────────────────────────────────────────────┐ ║
 * ║ │ HEADER (5 bytes = 40 bits)                                          │ ║
 * ║ ├─────────────────────────────────────────────────────────────────────┤ ║
 * ║ │ • conditionNodeCount     16 bits (bytes 0-1)                        │ ║
 * ║ │ • layoutNodeCount        16 bits (bytes 2-3)                        │ ║
 * ║ │ • maxPluckValue           8 bits (byte 4)                           │ ║
 * ║ └─────────────────────────────────────────────────────────────────────┘ ║
 * ║ ┌─────────────────────────────────────────────────────────────────────┐ ║
 * ║ │ NODES (nodeCount × 4 bytes each)                                    │ ║
 * ║ ├─────────────────────────────────────────────────────────────────────┤ ║
 * ║ │ Each node (32 bits = 4 bytes):                                      │ ║
 * ║ │   • encoding              3 bits  [31-29]                           │ ║
 * ║ │   • operator              5 bits  [28-24]                           │ ║
 * ║ │   • childCount           10 bits  [23-14]                           │ ║
 * ║ │   • sChildCount          10 bits  [13-4]                            │ ║
 * ║ │   • isInline              1 bit   [3]                               │ ║
 * ║ │   • isVariant             1 bit   [2]                               │ ║
 * ║ │   • isInLayout            1 bit   [1]                               │ ║
 * ║ │   • hasCompValue          1 bit   [0]                               │ ║
 * ║ └─────────────────────────────────────────────────────────────────────┘ ║
 * ║ ┌─────────────────────────────────────────────────────────────────────┐ ║
 * ║ │ COMPVALUES (variable length)                                        │ ║
 * ║ ├─────────────────────────────────────────────────────────────────────┤ ║
 * ║ │ For each node with hasCompValue=true (in BFS order):                │ ║
 * ║ │   • length               16 bits  (compValue byte length)           │ ║
 * ║ │   • data                 N bytes  (actual compValue data)           │ ║
 * ║ └─────────────────────────────────────────────────────────────────────┘ ║
 * ╚═════════════════════════════════════════════════════════════════════════╝
 *
 */
library ConditionPacker {
    uint256 private constant HEADER_BYTES = 5;
    uint256 private constant NODE_BYTES = 4;

    function pack(
        ConditionFlat[] memory conditions,
        Topology[] memory topology
    ) internal pure returns (bytes memory buffer) {
        _transform(conditions, topology);

        (
            uint256 layoutNodeCount,
            uint256 compValuesSize,
            uint256 maxPluckCount
        ) = _count(conditions, topology);

        uint256 nodeCount = conditions.length;

        buffer = new bytes(
            HEADER_BYTES + nodeCount * NODE_BYTES + compValuesSize
        );

        uint256 header = (nodeCount << 24) |
            (layoutNodeCount << 8) |
            maxPluckCount;
        assembly {
            mstore(add(buffer, 0x20), shl(216, header))
        }

        _packNodes(conditions, topology, buffer);
    }

    function _packNodes(
        ConditionFlat[] memory conditions,
        Topology[] memory topology,
        bytes memory buffer
    ) private pure {
        uint256 offset = HEADER_BYTES;
        uint256 compValueOffset = HEADER_BYTES + conditions.length * NODE_BYTES;

        for (uint256 i; i < conditions.length; ++i) {
            ConditionFlat memory condition = conditions[i];
            Topology memory t = topology[i];

            Encoding encoding = condition.paramType;
            bool isInline = !t.isNotInline;

            bytes memory compValue = condition.compValue;
            uint256 compValueLength = compValue.length;
            bool hasCompValue = compValueLength > 0;

            /*
             * ┌───────────────────────────────────────────────────────────┐
             * │ packed 32 bits, 4 bytes:                                  │
             * │   • encoding              3 bits  [31-29]                 │
             * │   • operator              5 bits  [28-24]                 │
             * │   • childCount           10 bits  [23-14]                 │
             * │   • sChildCount          10 bits  [13-4]                  │
             * │   • isInline              1 bit   [3]                     │
             * │   • isVariant             1 bit   [2]                     │
             * │   • isInLayout            1 bit   [1]                     │
             * │   • hasCompValue          1 bit   [0]                     │
             * └───────────────────────────────────────────────────────────┘
             */
            uint256 packed = (uint256(encoding) << 29) |
                (uint256(condition.operator) << 24) |
                (t.childCount << 14) |
                (t.sChildCount << 4) |
                (isInline ? 8 : 0) |
                (t.isVariant ? 4 : 0) |
                (t.isInLayout ? 2 : 0) |
                (hasCompValue ? 1 : 0);

            /*
             * The or with mload preserves bytes 4-31 (compValues written in
             * previous iterations) while writing our 4 bytes at positions 0-3.
             */
            assembly {
                let dest := add(add(buffer, 0x20), offset)
                mstore(dest, or(mload(dest), shl(224, packed)))
            }
            offset += NODE_BYTES;

            // Pack compValue writes at tail, no preserving required
            if (hasCompValue) {
                assembly {
                    let dest := add(add(buffer, 0x20), compValueOffset)
                    // write 2 bytes length
                    mstore(dest, shl(240, compValueLength))
                    // copy compValue body
                    mcopy(add(dest, 2), add(compValue, 0x20), compValueLength)
                }
                compValueOffset = compValueOffset + 2 + compValueLength;
            }
        }
    }

    function _count(
        ConditionFlat[] memory conditions,
        Topology[] memory topology
    )
        private
        pure
        returns (
            uint256 layoutNodeCount,
            uint256 compValuesSize,
            uint256 maxPluckCount
        )
    {
        for (uint256 i; i < conditions.length; ++i) {
            if (topology[i].isInLayout) {
                ++layoutNodeCount;
            }

            if (conditions[i].operator == Operator.Pluck) {
                uint8 pluckIndex = uint8(conditions[i].compValue[0]);
                if (pluckIndex + 1 > maxPluckCount) {
                    maxPluckCount = pluckIndex + 1;
                }
            }

            uint256 length = conditions[i].compValue.length;
            if (length > 0) {
                compValuesSize += 2 + length;
            }
        }
    }

    /**
     * @dev Normalizes conditions in-place before packing:
     *      1. AbiEncoded without compValue gets default leadingBytes (0x0004)
     *      2. EqualTo at offset has 32-byte head pointer stripped
     */
    function _transform(
        ConditionFlat[] memory conditions,
        Topology[] memory topology
    ) private pure {
        for (uint256 i; i < conditions.length; ++i) {
            /*
             * Patch AbiEncoded leadingBytes
             *
             * AbiEncoded nodes without compValue need a default leadingBytes of 4
             * (function selector size). Store as 2-byte big-endian value.
             */
            if (
                conditions[i].paramType == Encoding.AbiEncoded &&
                conditions[i].compValue.length == 0
            ) {
                conditions[i].compValue = hex"0004";
            }

            /*
             * Remove Extraneous Offsets
             *
             * Remove unnecessary offsets from compValue fields. This ensures a
             * consistent API where every `compValue` provided for use in
             * `Operator.EqualTo` is obtained by calling `abi.encode` directly.
             *
             * By removing the leading extraneous offset this makes
             * `abi.encode(...)` output line up with the layout produced by
             * Decoder inspection. Without it, callers would need to patch
             * compValues based on whether the payload is fully inline or at
             * offset.
             */
            if (
                conditions[i].operator == Operator.EqualTo &&
                topology[i].isNotInline
            ) {
                bytes memory compValue = conditions[i].compValue;
                assembly {
                    let newLength := sub(mload(compValue), 32)
                    compValue := add(compValue, 32)
                    mstore(compValue, newLength)
                }
                conditions[i].compValue = compValue;
            }
        }
    }
}
