// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library CompValueCompression {
    uint256 private constant shiftSize = 248;
    uint256 private constant shiftOffset = 240;
    uint256 private constant shiftSizeUncompressed = 232;
    uint256 private constant shiftResultStatic = 16;
    uint256 private constant shiftResultBytes = 24;

    uint256 private constant oneWord = 32;
    uint256 private constant headSizeStatic = 2;
    uint256 private constant headSizeBytes = 3;

    function compress(
        bytes32 compValue
    )
        internal
        view
        returns (Compression compression, uint256 size, bytes32 result)
    {
        // zeroes
        if (compValue == 0) {
            return (
                Compression.Static,
                headSizeStatic,
                bytes32(headSizeStatic << shiftSize)
            );
        }

        uint256 left = _leadingZeroes(compValue);
        uint256 right = _trailingZeroes(compValue);
        size = headSizeStatic + (oneWord - right - left);

        if (size < oneWord) {
            compression = Compression.Static;
            result =
                bytes32(size << shiftSize) |
                bytes32(left << shiftOffset) |
                bytes32((compValue << (left * 8)) >> shiftResultStatic);
        } else {
            compression = Compression.None;
            size = oneWord;
        }
    }

    function compress(
        bytes calldata compValue
    )
        internal
        view
        returns (Compression compression, uint256 size, bytes32 result)
    {
        // buffer too large
        if (compValue.length > 255) {
            return (Compression.Keccak256, oneWord, keccak256(compValue));
        }

        // buffer only zeroes
        uint256 left = _leadingZeroes(compValue);
        if (left == compValue.length) {
            return (
                Compression.Bytes,
                headSizeBytes,
                bytes32(headSizeBytes << shiftSize) |
                    bytes32(compValue.length << shiftSizeUncompressed)
            );
        }

        uint256 right = compValue.length - _trailingZeroes(compValue);
        size = headSizeBytes + (right - left);
        if (size < oneWord) {
            compression = Compression.Bytes;
            result =
                // 256 - 8
                bytes32(size << shiftSize) |
                // 256 - 16 -> offset
                bytes32(left << shiftOffset) |
                bytes32(compValue.length << shiftSizeUncompressed) |
                (bytes32(compValue[left:right]) >> shiftResultBytes);
        } else {
            compression = Compression.Keccak256;
            size = oneWord;
            result = keccak256(compValue);
        }
    }

    function _leadingZeroes(
        bytes32 compValue
    ) private view returns (uint256 result) {
        uint256 mask = 0xff << 248;
        for (; mask != 0; mask >>= 8) {
            if (uint256(compValue) & mask == 0) {
                ++result;
            } else {
                break;
            }
        }
    }

    function _leadingZeroes(
        bytes calldata compValue
    ) private view returns (uint256 result) {
        uint256 length = compValue.length;
        for (uint256 i; i < length; ++i) {
            if (bytes1(compValue[i]) == 0) {
                ++result;
            } else {
                break;
            }
        }
    }

    function _trailingZeroes(
        bytes32 compValue
    ) private view returns (uint256 result) {
        uint256 mask = 0xff;
        for (; mask != 0; mask <<= 8) {
            if (uint256(compValue) & mask == 0) {
                ++result;
            } else {
                break;
            }
        }
    }

    function _trailingZeroes(
        bytes calldata compValue
    ) private view returns (uint256 result) {
        for (int i = int(compValue.length) - 1; i >= 0; --i) {
            if (bytes1(compValue[uint256(i)]) == 0) {
                ++result;
            } else {
                break;
            }
        }
    }
}
