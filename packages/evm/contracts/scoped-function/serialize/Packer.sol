// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Types.sol";
import "../../AbiTypes.sol";

/**
 * ScopedFunction Layout in Contract Storage
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ HEADER (4 bytes)                                                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ • typesOffset              16 bits (0-65535)                        │
 * │ • allowanceOffset          16 bits (0-65535)                        │
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
 * │     • paramType             3 bits                                  │
 * │     • operator              5 bits                                  │
 * │     • childCount            8 bits  (0-255)                         │
 * │     • structuralChildCount  8 bits  (0-255)                         │
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
 * - Offsets are in bytes
 * - Children are implicitly sequential in BFS order (no childrenStart needed)
 */

library Packer {
    // ═══════════════════════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════════════════════

    uint256 private constant CONDITION_COUNT_BYTES = 2;
    uint256 private constant CONDITION_NODE_BYTES = 5;
    uint256 private constant TYPETREE_COUNT_BYTES = 2;
    uint256 private constant TYPETREE_NODE_BYTES = 2;

    // ═══════════════════════════════════════════════════════════════════════════
    // Main Packing Function
    // ═══════════════════════════════════════════════════════════════════════════

    function pack(
        ConditionFlat[] memory conditions,
        TypeTree memory typeNode,
        bytes32[] memory allowanceKeys
    ) internal pure returns (bytes memory buffer) {
        uint256 size = 4 +
            _conditionPackedSize(conditions) +
            _typeTreePackedSize(typeNode) +
            (32 * (allowanceKeys.length + 1));

        buffer = new bytes(size);

        uint256 offset = 4;

        offset += _packConditions(conditions, buffer, offset);

        // Pack typesOffset
        _mstore(uint16(offset), buffer, 0);
        offset += _packTypeTree(typeNode, buffer, offset);

        // Pack allowanceOffset
        _mstore(uint16(offset), buffer, 2);
        offset += _mstore(allowanceKeys, buffer, offset);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Condition Packing
    // ═══════════════════════════════════════════════════════════════════════════

    function _conditionPackedSize(
        ConditionFlat[] memory conditions
    ) internal pure returns (uint256 result) {
        uint256 count = conditions.length;

        // Header (2 bytes) + nodes
        result = CONDITION_COUNT_BYTES + count * CONDITION_NODE_BYTES;

        // Add space for compValues (32 bytes each for operators >= EqualTo)
        for (uint256 i; i < count; ) {
            if (conditions[i].operator >= Operator.EqualTo) {
                result += 32 + 2;
            }
            unchecked {
                ++i;
            }
        }
    }

    function _packConditions(
        ConditionFlat[] memory conditions,
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (uint256) {
        // Pack nodeCount
        uint8 b1 = uint8(conditions.length >> 8) & 0xFF;
        uint8 b2 = uint8(conditions.length) & 0xFF;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            mstore8(ptr, b1)
            mstore8(add(ptr, 0x01), b2)
        }
        _packConditionNodes(conditions, buffer, offset + CONDITION_COUNT_BYTES);

        return _conditionPackedSize(conditions);
    }

    function _packConditionNodes(
        ConditionFlat[] memory conditions,
        bytes memory buffer,
        uint256 offset
    ) private pure {
        // Calculate compValues start offset
        uint256 compValueOffset = offset +
            (conditions.length * CONDITION_NODE_BYTES);

        for (uint256 i; i < conditions.length; ++i) {
            (, uint256 childCount) = _childBounds(conditions, i);
            uint256 structuralChildCount = _structuralChildCount(conditions, i);

            // Node
            {
                uint8 b1 = (uint8(conditions[i].paramType) << 5) |
                    uint8(conditions[i].operator);
                uint8 b2 = uint8(childCount);
                uint8 b3 = uint8(structuralChildCount);
                uint8 b4 = uint8(compValueOffset >> 8);
                uint8 b5 = uint8(compValueOffset);

                assembly {
                    mstore8(add(buffer, add(0x20, offset)), b1)
                    mstore8(add(buffer, add(0x21, offset)), b2)
                    mstore8(add(buffer, add(0x22, offset)), b3)
                    mstore8(add(buffer, add(0x23, offset)), b4)
                    mstore8(add(buffer, add(0x24, offset)), b5)
                }
                offset += CONDITION_NODE_BYTES;
            }

            // CompValue
            if (conditions[i].operator >= Operator.EqualTo) {
                uint8 b1 = 0;
                uint8 b2 = 32;
                bytes32 compValue = conditions[i].operator == Operator.EqualTo
                    ? keccak256(conditions[i].compValue)
                    : bytes32(conditions[i].compValue);

                assembly {
                    let ptr := add(buffer, add(0x20, compValueOffset))
                    mstore8(ptr, b1)
                    mstore8(add(ptr, 0x01), b2)
                    mstore(add(ptr, 0x02), compValue)
                }
                compValueOffset += 34;
            }
        }
    }

    function _childBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (uint256 start, uint256 length) {
        uint256 len = conditions.length;
        unchecked {
            for (uint256 i = index + 1; i < len; ++i) {
                uint256 parent = conditions[i].parent;

                if (parent == index) {
                    if (length == 0) start = i;
                    ++length;
                } else if (parent > index) {
                    break;
                }
            }
        }
    }

    function _structuralChildCount(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (uint256) {
        (uint256 start, uint256 length) = _childBounds(conditions, index);

        // Count non-structural children from the end (they're guaranteed to come last)
        uint256 nonStructuralCount = 0;
        for (uint256 i = length - 1; i >= 0; --i) {
            if (_isNonStructural(conditions, start + i)) {
                ++nonStructuralCount;
            } else {
                break;
            }
        }

        return length - nonStructuralCount;
    }

    function _isNonStructural(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        // NonStructural if paramType is None and all descendants are None
        if (conditions[index].paramType != AbiType.None) {
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
    // TypeTree Packing
    // ═══════════════════════════════════════════════════════════════════════════

    function _typeTreePackedSize(
        TypeTree memory node
    ) internal pure returns (uint256 result) {
        // Header (2 bytes) + all nodes (2 bytes each)
        result = TYPETREE_COUNT_BYTES + _countNodes(node) * TYPETREE_NODE_BYTES;
    }

    function _packTypeTree(
        TypeTree memory tree,
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (uint256) {
        TypeNodeFlat[] memory nodes = _flattenBFS(tree);

        // Write header: [16 bits nodeCount]
        uint256 childCount = nodes.length;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            mstore(ptr, shl(240, childCount))
        }
        offset += TYPETREE_COUNT_BYTES;

        // Pack all nodes (2 bytes each)
        for (uint256 i; i < nodes.length; ) {
            // Pack 16 bits:
            // Bits 0-2: type (3 bits)
            // Bits 3-10: childCount (8 bits)
            // Bits 11-15: reserved (5 bits)
            uint256 mask = ~(uint256(0xFFFFFFFF) << 240);
            uint256 packed = ((uint256(nodes[i]._type) << 13) |
                ((nodes[i].childCount & 0xFF) << 5)) << 240;

            // Write 2 bytes
            assembly {
                let ptr := add(buffer, add(0x20, offset))
                let existing := mload(ptr)
                existing := and(existing, mask)
                mstore(ptr, or(packed, existing))
            }

            unchecked {
                offset += TYPETREE_NODE_BYTES;
                ++i;
            }
        }

        return TYPETREE_COUNT_BYTES + nodes.length * TYPETREE_NODE_BYTES;
    }

    function _flattenBFS(
        TypeTree memory root
    ) internal pure returns (TypeNodeFlat[] memory) {
        uint256 total = _countNodes(root);
        TypeNodeFlat[] memory result = new TypeNodeFlat[](total);

        TypeTree[] memory queue = new TypeTree[](total);
        uint256[] memory parents = new uint256[](total);

        queue[0] = root;
        parents[0] = 0;

        uint256 head = 0;
        uint256 tail = 1;
        uint256 current = 0;

        while (head < tail) {
            TypeTree memory node = queue[head];
            uint256 parent = parents[head];
            head++;

            // Record this node
            result[current] = TypeNodeFlat({
                _type: node._type,
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
        TypeTree memory node
    ) internal pure returns (uint256 count) {
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += _countNodes(node.children[i]);
        }
    }

    struct TypeNodeFlat {
        uint256 parent;
        AbiType _type;
        uint256 childCount;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Storage Helpers
    // ═══════════════════════════════════════════════════════════════════════════

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
