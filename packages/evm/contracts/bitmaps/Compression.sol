// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library Compression {
    enum Mode {
        Empty,
        Uncompressed,
        Word,
        Bytes,
        Hash
    }
    uint256 private constant shiftSize = 248;
    uint256 private constant shiftOffset = 240;
    uint256 private constant shiftLength = 232;
    uint256 private constant shiftResultStatic = 16;
    uint256 private constant shiftResultBytes = 24;

    uint256 private constant oneWord = 32;
    uint256 private constant staticHeadSize = 2;
    uint256 private constant dynamicHeadSize = 3;

    function compressWord(
        bytes32 compValue
    ) internal pure returns (Mode compression, uint256 size, bytes32 chunk) {
        // zeroes
        if (compValue == 0) {
            return (
                Mode.Word,
                staticHeadSize,
                bytes32(staticHeadSize << shiftSize)
            );
        }

        uint256 left = _leadingZeroes(compValue);
        uint256 right = _trailingZeroes(compValue);
        size = staticHeadSize + (oneWord - right - left);

        if (size < oneWord) {
            compression = Mode.Word;
            chunk =
                bytes32(size << shiftSize) |
                bytes32(left << shiftOffset) |
                bytes32((compValue << (left * 8)) >> shiftResultStatic);
        } else {
            compression = Mode.Uncompressed;
            size = oneWord;
        }
    }

    function compressBytes(
        bytes calldata compValue
    ) internal pure returns (Mode compression, uint256 size, bytes32 chunk) {
        // buffer too large
        if (compValue.length > 255) {
            return (Mode.Hash, oneWord, keccak256(compValue));
        }

        uint256 left = _leadingZeroes(compValue);
        // buffer only zeroes
        if (left == compValue.length) {
            return (
                Mode.Bytes,
                dynamicHeadSize,
                bytes32(dynamicHeadSize << shiftSize) |
                    bytes32(compValue.length << shiftLength)
            );
        }

        uint256 right = compValue.length - _trailingZeroes(compValue);
        size = dynamicHeadSize + (right - left);
        if (size < oneWord) {
            compression = Mode.Bytes;
            chunk =
                // 256 - 8
                bytes32(size << shiftSize) |
                // 256 - 16 -> offset
                bytes32(left << shiftOffset) |
                bytes32(compValue.length << shiftLength) |
                (bytes32(compValue[left:right]) >> shiftResultBytes);
        } else {
            compression = Mode.Hash;
            size = oneWord;
            chunk = keccak256(compValue);
        }
    }

    function extractWord(
        bytes32 payload
    ) internal pure returns (bytes32 compValue) {
        uint256 offset = uint256(payload >> shiftOffset) & 0xff;
        bytes32 content = payload << (staticHeadSize * 8);
        return content >> (offset * 8);
    }

    function extractBytes(
        bytes32 payload
    ) internal pure returns (bytes memory compValue) {
        uint256 size = (uint256(payload >> shiftSize) & 0xff) - dynamicHeadSize;
        uint256 offset = uint256(payload >> shiftOffset) & 0xff;
        uint256 length = uint256(payload >> shiftLength) & 0xff;
        bytes32 content = payload << (dynamicHeadSize * 8);

        compValue = new bytes(length);
        for (uint256 i; i < size; ++i) {
            compValue[i + offset] = content[i];
        }
    }

    function _leadingZeroes(
        bytes32 compValue
    ) private pure returns (uint256 result) {
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
    ) private pure returns (uint256 result) {
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
    ) private pure returns (uint256 result) {
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
    ) private pure returns (uint256 result) {
        for (int i = int(compValue.length) - 1; i >= 0; --i) {
            if (bytes1(compValue[uint256(i)]) == 0) {
                ++result;
            } else {
                break;
            }
        }
    }
}
