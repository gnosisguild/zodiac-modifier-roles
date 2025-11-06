// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

import "./ConditionPacker.sol";
import "./TypeTreePacker.sol";

/**
 * ScopedFunctionPacker Memory Layout
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ HEADER (6 bytes)                                                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ • typesOffset              16 bits (0-65535)                        │
 * │ • allowanceOffset          16 bits (0-65535)                        │
 * │ • avatarCount              16 bits (0-65535)                        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ CONDITION TREE SECTION (at conditionTreeOffset)                     │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Header (2 bytes):                                                   │
 * │   • nodeCount              16 bits (0-65535)                        │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Nodes (nodeCount × 4 bytes each):                                   │
 * │   Each node (32 bits):                                              │
 * │     • paramType             3 bits                                  │
 * │     • operator              5 bits                                  │
 * │     • childCount            8 bits  (0-255)                         │
 * │     • compValueOffset      16 bits  (0 if no value)                 │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ CompValues (variable length):                                       │
 * │   For each condition with operator >= EqualTo:                      │
 * │     • length               16 bits  (compValue byte length)         │
 * │     • data                 N bytes  (actual compValue data)         │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ TYPE TREE SECTION (at typeTreeOffset)                               │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Header (2 bytes):                                                   │
 * │   • nodeCount              16 bits (0-65535)                        │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Nodes (nodeCount × 2 bytes each):                                   │
 * │   Each node (11 bits, padded to 2 bytes):                           │
 * │     • type                  3 bits  (AbiType 0-7)                   │
 * │     • childCount            8 bits  (0-255)                         │
 * │     • reserved              5 bits                                  │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ ALLOWANCE Keys (at allowanceOffset)                                 │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ • length                   32 bytes                                 │
 * │ • keys[]                   32 bytes × length                        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 *
 * NOTES:
 * - All offsets are relative to the start of the buffer
 * - Offsets are in bytes, not bits
 * - CompValue data is variable-length with explicit length prefix
 * - Children are implicitly sequential in BFS order (no childrenStart needed)
 */

library ScopedFunctionPacker {
    function pack(
        ConditionFlat[] memory conditions,
        TypeTree memory typeNode,
        bytes32[] memory allowanceKeys,
        uint256 avatarCount
    ) internal pure returns (bytes memory buffer) {
        uint256 size = 6 +
            ConditionPacker.packedSize(conditions) +
            TypeTreePacker.packedSize(typeNode) +
            (32 * (allowanceKeys.length + 1));

        buffer = new bytes(size);

        uint256 offset = 6;

        // pack conditionsOffset
        offset += ConditionPacker.pack(conditions, buffer, offset);

        // pack typesOffset
        _mstore(uint16(offset), buffer, 0);
        offset += TypeTreePacker.pack(typeNode, buffer, offset);

        // pack allowanceOffset
        _mstore(uint16(offset), buffer, 2);
        offset += _mstore(allowanceKeys, buffer, offset);

        // pack avatarCount
        _mstore(uint16(avatarCount), buffer, 4);
    }

    function _mstore(
        uint16 value,
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256) {
        uint8 b1 = uint8((value >> 8) & 0xff);
        uint8 b2 = uint8(value & 0xff);
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            mstore8(ptr, b1)
            mstore8(add(ptr, 0x01), b2)
        }
        return 2;
    }

    function _mstore(
        bytes32[] memory keys,
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256) {
        uint256 len = keys.length;
        assembly {
            mstore(add(buffer, add(0x20, offset)), len)
        }
        for (uint256 i; i < keys.length; ++i) {
            uint256 keyOffset = offset + 32 + i * 32;
            bytes32 key = keys[i];
            assembly {
                mstore(add(buffer, add(0x20, keyOffset)), key)
            }
        }
        return 32 * (len + 1);
    }
}
