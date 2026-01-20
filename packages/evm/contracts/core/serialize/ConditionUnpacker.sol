// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title  ConditionUnpacker
 * @notice A library that provides unpacking functions for reconstructing
 *         Condition and Layout trees from a memory-optimized buffer.
 *
 * @dev    This is performance-critical code. Every transaction execution
 *         begins by loading packed conditions from contract storage
 *         (via extcodecopy) and performing tree unpacking. The implementation
 *         is deliberately low-level to minimize execution overhead.
 *
 * @author gnosisguild
 */
library ConditionUnpacker {
    uint256 private constant HEADER_BYTES = 5;
    uint256 private constant NODE_BYTES = 4;

    function unpack(
        bytes memory buffer
    )
        internal
        view
        returns (
            Condition memory condition,
            Layout memory layout,
            uint256 maxPluckValue
        )
    {
        /*
         * ┌───────────────────────────────────────────────────────────────┐
         * │ header 40 bits, 5 bytes:                                      │
         * │   • conditionNodeCount    16 bits  [39-24]                    │
         * │   • layoutNodeCount       16 bits  [23-8]                     │
         * │   • maxPluckCount          8 bits  [7-0]                      │
         * └───────────────────────────────────────────────────────────────┘
         */
        uint256 header = uint40(bytes5(buffer));

        Condition[] memory conditions = new Condition[]((header >> 24));
        Layout[] memory layouts = new Layout[]((header >> 8) & 0xFFFF);
        _unpackTrees(buffer, conditions, layouts);

        condition = conditions[0];
        if (layouts.length > 0) layout = layouts[0];
        maxPluckValue = header & 0xFF;
    }

    function _unpackTrees(
        bytes memory buffer,
        Condition[] memory conditions,
        Layout[] memory layouts
    ) private view {
        /**
         * @dev Unpacks buffer into Condition and Layout trees in a single pass.
         *      Both trees are built simultaneously from the unified node
         *      format. This implementation provides a ~3x improvement in gas
         *      cost compared to a naive approach involving multiple loops,
         *      auxiliary functions, and standard child array allocations.
         */

        uint256 offset;
        uint256 compValueOffset;
        uint256 childConditionPtr;
        uint256 childLayoutPtr;
        assembly {
            offset := add(add(buffer, 0x20), HEADER_BYTES)
            compValueOffset := add(offset, mul(mload(conditions), NODE_BYTES))
            childConditionPtr := add(conditions, 0x40)
            childLayoutPtr := add(layouts, 0x40)
        }

        uint256 l;
        for (uint256 c; c < conditions.length; ++c) {
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
                    condition.sChildCount = (packed >> 4) & 0x3FF;
                    uint256 copyPtr;
                    (copyPtr, childConditionPtr) = _shallowCopy(
                        childConditionPtr,
                        childCount
                    );
                    assembly {
                        mstore(add(condition, 0x80), copyPtr)
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
                    bytes memory compValue;
                    assembly {
                        compValue := mload(0x40)
                        mstore(compValue, length)
                        mcopy(add(compValue, 0x20), compValueOffset, length)
                        mstore(0x40, add(add(compValue, 0x20), length))
                        compValueOffset := add(compValueOffset, length)
                    }
                    condition.compValue = compValue;
                }
            }

            // isInLayout
            if ((packed & 2) != 0) {
                // Encoding.EtherValue(6) Encoding.None(0)
                if (encoding == 6) encoding = 0;

                Layout memory layout = layouts[l++];

                // isVariant && !isArray
                layout.encoding = ((packed & 4) != 0) && encoding != 4
                    ? Encoding.Dynamic
                    : Encoding(encoding);

                layout.inlined = (packed & 8) != 0;

                if (condition.sChildCount > 0) {
                    layout.leadingBytes = leadingBytes;

                    // !isVariant && isArray
                    uint256 childCount = ((packed & 4) == 0 && encoding == 4)
                        ? 1 // Non-Variant Arrays -> use first child as template
                        : condition.sChildCount;

                    uint256 copyPtr;
                    (copyPtr, childLayoutPtr) = _shallowCopy(
                        childLayoutPtr,
                        childCount
                    );
                    assembly {
                        mstore(add(layout, 0x20), copyPtr)
                    }
                }
            }

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

    function _shallowCopy(
        uint256 src,
        uint256 count
    ) private pure returns (uint256 dest, uint256 nextSrc) {
        assembly {
            //let size := mul(count, 0x20)
            let size := shl(5, count)

            // load and advance free memory pointer
            dest := mload(0x40)
            mstore(0x40, add(add(dest, 0x20), size))

            // store length
            mstore(dest, count)
            // copy the array
            mcopy(add(dest, 0x20), src, size)

            nextSrc := add(src, size)
        }
    }
}
