// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AbiDecoder.sol";

import {Status} from "../../types/Types.sol";

/**
 * @title BitmaskChecker
 *
 * @notice Validates that a value matches an expected pattern after applying a bitmask.
 *
 * @dev compValue layout: [shift (2 bytes)][mask (N bytes)][expected (N bytes)]
 *      where N = (compValue.length - 2) / 2
 *
 *      - Static params: value starts at payload.location, limit is data.length
 *      - Dynamic params: value starts at payload.location + 32, limit is payload.size
 *
 *      Returns BitmaskOverflow if shift + N exceeds available bytes.
 *      Returns BitmaskNotAllowed if (value & mask) != expected.
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
        uint256 maskLength = (compValue.length - 2) / 2;

        bool isInline = payload.size == 32;
        uint256 start = payload.location + (isInline ? 0 : 32);
        uint256 end = isInline ? data.length : payload.location + payload.size;

        if (shift + maskLength > end - start) {
            return Status.BitmaskOverflow;
        }

        bytes calldata value = data[start:];

        // Check 32 bytes at a time
        for (uint256 i; i < maskLength; i += 32) {
            bytes32 mask;
            assembly {
                mask := mload(add(add(compValue, 0x22), i))
            }

            bytes32 expected;
            assembly {
                expected := mload(add(add(compValue, 0x22), add(maskLength, i)))
            }

            // When maskLength < i + 32, we need to mask out trailing garbage
            // Calculate rinse to zero out bytes beyond maskLength
            uint256 byteCount = maskLength - i;
            if (byteCount < 32) {
                uint256 bitCount = 8 * (32 - byteCount);
                bytes32 rinse = bytes32(type(uint256).max << bitCount);
                mask = mask & rinse;
                expected = expected & rinse;
            }

            // Load 32 bytes from value. May read past boundary, but rinse
            // already zeroes out excess bits before comp. More gas efficient
            bytes32 slice;
            assembly {
                slice := calldataload(add(value.offset, add(shift, i)))
            }

            if (slice & mask != expected) {
                return Status.BitmaskNotAllowed;
            }
        }

        return Status.Ok;
    }
}
