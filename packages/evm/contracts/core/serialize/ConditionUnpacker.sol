// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title  ConditionUnpacker
 * @notice A library that provides unpacking functions for reconstructing
 *         Condition trees with payload annotations from a memory-optimized buffer.
 *
 * @dev    This is performance-critical code. Every transaction execution
 *         begins by loading packed conditions from contract storage
 *         (via extcodecopy) and performing tree unpacking. The implementation
 *         is deliberately low-level to minimize execution overhead.
 *
 * @author gnosisguild
 */
library ConditionUnpacker {
    uint256 private constant HEADER_BYTES = 3;
    uint256 private constant NODE_BYTES = 4;

    function unpack(
        bytes memory buffer
    )
        internal
        view
        returns (Condition memory condition, uint256 maxPluckValue)
    {
        /*
         * ┌───────────────────────────────────────────────────────────────┐
         * │ header 24 bits, 3 bytes:                                      │
         * │   • conditionNodeCount    16 bits  [23-8]                     │
         * │   • maxPluckCount          8 bits  [7-0]                      │
         * └───────────────────────────────────────────────────────────────┘
         */
        uint256 header = uint24(bytes3(buffer));

        Condition[] memory conditions = new Condition[]((header >> 8));

        _unpackConditions(buffer, conditions);

        condition = conditions[0];
        maxPluckValue = header & 0xFF;
    }

    function _unpackConditions(
        bytes memory buffer,
        Condition[] memory conditions
    ) private view {
        uint256 offset;
        uint256 compValueOffset;
        uint256 childConditionPtr;
        assembly {
            offset := add(add(buffer, 0x20), HEADER_BYTES)
            compValueOffset := add(offset, mul(mload(conditions), NODE_BYTES))
            childConditionPtr := add(conditions, 0x40)
        }

        for (uint256 c; c < conditions.length; ++c) {
            /*
             * ┌───────────────────────────────────────────────────────────┐
             * │ packed 32 bits, 4 bytes:                                  │
             * │   • encoding              3 bits  [31-29]                 │
             * │   • operator              5 bits  [28-24]                 │
             * │   • childCount           10 bits  [23-14]                 │
             * │   • inlinedSize          13 bits  [13-1]                  │
             * │   • hasCompValue          1 bit   [0]                     │
             * └───────────────────────────────────────────────────────────┘
             */
            uint256 packed;
            assembly {
                packed := shr(224, mload(offset))
                offset := add(offset, NODE_BYTES)
            }

            Condition memory condition = conditions[c];
            condition.index = c;
            condition.operator = Operator((packed >> 24) & 0x1F);

            {
                uint256 childCount = (packed >> 14) & 0x3FF;
                if (childCount > 0) {
                    /*
                     * shallowCopy children array
                     */
                    assembly {
                        let size := mul(childCount, 0x20)
                        // free mem pointer: load
                        let dest := mload(0x40)
                        // free mem pointer: advance
                        mstore(0x40, add(add(dest, 0x20), size))

                        // new array: store length
                        mstore(dest, childCount)
                        // new array: shallow copy body
                        mcopy(add(dest, 0x20), childConditionPtr, size)

                        //condition: point to copied array
                        mstore(add(condition, 0x60), dest)
                        // advance child pointer
                        childConditionPtr := add(childConditionPtr, size)
                    }
                }
            }

            uint256 encoding = (packed >> 29);

            uint256 leadingBytes;
            // hasCompValue
            if ((packed & 1) != 0) {
                uint256 length;
                assembly {
                    length := shr(240, mload(compValueOffset))
                    compValueOffset := add(compValueOffset, 2)
                }

                // Encoding.AbiEncoded(5)
                if (encoding == 5) {
                    assembly {
                        leadingBytes := shr(240, mload(compValueOffset))
                        compValueOffset := add(compValueOffset, 2)
                        length := sub(length, 2)
                    }
                }

                if (length > 0) {
                    assembly {
                        // free mem pointer: load
                        let compValue := mload(0x40)
                        // free mem pointer: advance
                        mstore(0x40, add(add(compValue, 0x20), length))

                        // new buffer: store length
                        mstore(compValue, length)
                        // new buffer: copy body
                        mcopy(add(compValue, 0x20), compValueOffset, length)

                        //condition: point to copied buffer
                        mstore(add(condition, 0x40), compValue)
                        // advance pointer
                        compValueOffset := add(compValueOffset, length)
                    }
                }
            }

            // Set payload properties directly on condition
            // EtherValue(6) maps to None(0) for reading context.value
            if (encoding == 6) encoding = 0;

            condition.payload.encoding = Encoding(encoding);
            uint256 size = ((packed >> 1) & 0x1FFF) * 32;
            condition.payload.inlined = size > 0;
            condition.payload.size = size;
            condition.payload.leadingBytes = leadingBytes;

            if (condition.operator == Operator.EqualToAvatar) {
                condition.operator = Operator.EqualTo;
                address avatar;
                assembly {
                    avatar := sload(101)
                }
                condition.compValue = abi.encode(avatar);
            }
        }
    }
}
