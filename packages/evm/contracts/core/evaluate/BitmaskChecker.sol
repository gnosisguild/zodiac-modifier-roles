// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AbiDecoder.sol";

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
        bytes memory compValue,
        Payload memory payload
    ) internal pure returns (Status) {
        uint256 shift = uint16(bytes2(compValue));
        uint256 length = (compValue.length - 2) / 2;

        // Dynamic params: skip 32-byte length prefix.
        // Dynamic params: restrict to that param's payload size
        bool isInline = payload.size == 32;
        uint256 start = payload.location + (isInline ? 0 : 32);
        uint256 end = isInline ? data.length : payload.location + payload.size;

        if (shift + length > end - start) {
            return Status.BitmaskOverflow;
        }

        bytes calldata value = data[start:];

        for (uint256 i; i < length; i += 32) {
            /*
             * Load actual, expected, and mask in 32-byte chunks. Final chunk
             * gets rinsed if less than 32 bytes remain.
             */
            bytes32 rinse = _rinseMask(length - i);

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

            if (expected & rinse != actual & mask & rinse) {
                return Status.BitmaskNotAllowed;
            }
        }

        return Status.Ok;
    }

    /// @dev Returns a mask with leading 1s for byteCount bytes, rest 0s.
    function _rinseMask(uint256 byteCount) private pure returns (bytes32) {
        uint256 bytesToRinse = byteCount > 32 ? 0 : 32 - byteCount;
        return bytes32(type(uint256).max << (bytesToRinse * 8));
    }
}
