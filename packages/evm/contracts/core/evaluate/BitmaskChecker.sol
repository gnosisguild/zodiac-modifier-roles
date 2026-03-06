// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import {Status} from "../../types/Types.sol";

/**
 * @title BitmaskChecker
 * @notice Validates that a value matches an expected pattern after applying a bitmask.
 *
 * @dev compValue packs shift, mask and expected.
 *
 * @author gnosisguild
 *
 */
library BitmaskChecker {
    function check(
        bytes calldata data,
        uint256 location,
        bytes memory compValue,
        bool inlined
    ) internal pure returns (Status) {
        uint256 shift = uint16(bytes2(compValue));
        uint256 length = (compValue.length - 2) / 2;

        uint256 start = location + (inlined ? 0 : 32);
        uint256 end = data.length;

        if (shift + length > end - start) {
            return Status.BitmaskOverflow;
        }

        bytes calldata value = data[start:];

        /*
         * Load actual, expected, and mask in 32-byte chunks. Final chunk
         * gets rinsed if less than 32 bytes remain.
         */
        for (uint256 i; i < length; i += 32) {
            /*
             * compValue memory layout:
             * | 32: length | 2: shift | N: mask | N: expected |
             *                         ^--- 0x22 offset
             */
            bytes32 mask;
            assembly {
                mask := mload(add(add(compValue, 0x22), i))
            }

            bytes32 expected;
            assembly {
                expected := mload(add(add(compValue, 0x22), add(length, i)))
            }

            bytes32 actual;
            assembly {
                actual := calldataload(add(value.offset, add(shift, i)))
            }

            bytes32 rinseMask = _rinseMask(length - i);

            if (expected & rinseMask != actual & mask & rinseMask) {
                return Status.BitmaskNotAllowed;
            }
        }

        return Status.Ok;
    }

    /// @dev Returns a mask with leading 1s for byteCount bytes, rest 0s.
    function _rinseMask(uint256 bytesLeft) private pure returns (bytes32) {
        uint256 bitsToRinse = (bytesLeft > 31 ? 0 : 32 - bytesLeft) * 8;
        return bytes32(type(uint256).max << bitsToRinse);
    }
}
