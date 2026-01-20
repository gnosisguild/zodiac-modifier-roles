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
            bool hasCompValue = condition.compValue.length > 0;

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
                let ptr := add(add(buffer, 0x20), offset)
                mstore(ptr, or(mload(ptr), shl(224, packed)))
            }
            offset += NODE_BYTES;

            // Pack compValue if present
            if (hasCompValue) {
                compValueOffset = _packCompValue(
                    condition,
                    buffer,
                    compValueOffset
                );
            }
        }
    }

    function _packCompValue(
        ConditionFlat memory condition,
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256) {
        bytes memory compValue = condition.compValue;
        uint256 compValueLength = compValue.length;

        assembly {
            let ptr := add(add(buffer, 0x20), offset)
            mstore(ptr, shl(240, compValueLength))
            mcopy(add(ptr, 2), add(compValue, 0x20), compValueLength)
        }

        return offset + 2 + compValueLength;
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
            ConditionFlat memory condition = conditions[i];

            // Layout counting
            if (topology[i].isInLayout) {
                ++layoutNodeCount;
            }

            // MaxPluck counting
            if (condition.operator == Operator.Pluck) {
                uint8 pluckIndex = uint8(condition.compValue[0]);
                if (pluckIndex + 1 > maxPluckCount) {
                    maxPluckCount = pluckIndex + 1;
                }
            }

            if (condition.compValue.length > 0) {
                // length + body
                compValuesSize += 2 + condition.compValue.length;
            }
        }
    }
}
