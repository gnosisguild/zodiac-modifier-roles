// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

library ConditionPacker {
    uint256 private constant BYTES_COUNT_ENCODING = 2;
    uint256 private constant BYTES_NODE_BODY = 4;

    function packedSize(
        ConditionFlat[] memory conditions
    ) internal pure returns (uint256 result) {
        uint256 count = conditions.length;

        // Header (4 bytes)
        result = BYTES_COUNT_ENCODING + count * BYTES_NODE_BODY;

        // Add space for compValues (32 bytes each for operators >= EqualTo)
        for (uint256 i; i < count; ) {
            if (conditions[i].operator >= Operator.EqualTo) {
                // this will change soon
                result += 32 + 2;
            }
            unchecked {
                ++i;
            }
        }
    }

    function pack(
        ConditionFlat[] memory conditions,
        bytes memory buffer,
        uint256 offset
    ) internal pure returns (uint256) {
        // pack nodeCount
        uint8 b1 = uint8(conditions.length >> 8) & 0xFF;
        uint8 b2 = uint8(conditions.length) & 0xFF;
        assembly {
            let ptr := add(buffer, add(0x20, offset))
            mstore8(ptr, b1)
            mstore8(add(ptr, 0x01), b2)
        }
        _packNodes(conditions, buffer, offset + BYTES_COUNT_ENCODING);

        return packedSize(conditions);
    }

    function _packNodes(
        ConditionFlat[] memory conditions,
        bytes memory buffer,
        uint256 offset
    ) private pure {
        // Calculate compValues start offset
        uint256 compValueOffset = offset +
            (conditions.length * BYTES_NODE_BODY);

        for (uint256 i; i < conditions.length; ++i) {
            (, uint256 childrenCount) = _childBounds(conditions, i);

            /*
             * Node
             */
            {
                uint8 b1 = (uint8(conditions[i].paramType) << 5) |
                    uint8(conditions[i].operator);
                uint8 b2 = uint8(childrenCount);
                uint8 b3 = uint8(compValueOffset >> 8) & 0xFF;
                uint8 b4 = uint8(compValueOffset) & 0xFF;

                assembly {
                    // Pointer to the target position inside `buffer`
                    let ptr := add(buffer, add(0x20, offset))

                    mstore8(ptr, b1)
                    mstore8(add(ptr, 0x01), b2)
                    mstore8(add(ptr, 0x02), b3)
                    mstore8(add(ptr, 0x03), b4)
                }
                offset += BYTES_NODE_BODY;
            }

            /*
             * CompValue
             */
            if (conditions[i].operator >= Operator.EqualTo) {
                // this need to be changed soon
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
}
