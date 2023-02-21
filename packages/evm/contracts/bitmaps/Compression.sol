// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library Compression {
    enum Mode {
        Empty,
        Uncompressed,
        Compressed,
        Hash
    }

    uint256 private constant offsetSizeCompressed = 248;
    uint256 private constant offsetSizeExtracted = 240;
    uint256 private constant offsetShift = 232;
    uint256 private constant offsetPayload = 24;

    uint256 private constant oneWord = 32;
    uint256 private constant headSize = 3;

    function compress(
        bytes calldata data
    ) internal pure returns (Mode compression, uint256 size, bytes32 chunk) {
        // buffer too large
        uint256 length = data.length;
        if (length > 255) {
            return (Mode.Hash, oneWord, keccak256(data));
        }

        uint256 left = _leadingZeroes(data);
        // buffer only zeroes
        if (left == length) {
            return (
                Mode.Compressed,
                headSize,
                bytes32(
                    (headSize << offsetSizeCompressed) |
                        (length << offsetSizeExtracted)
                )
            );
        }

        uint256 right = length - _trailingZeroes(data);
        size = headSize + (right - left);

        if (size < oneWord) {
            compression = Mode.Compressed;
            chunk =
                bytes32(size << offsetSizeCompressed) |
                bytes32(length << offsetSizeExtracted) |
                bytes32(left << offsetShift) |
                (bytes32(data[left:right]) >> offsetPayload);
        } else if (length > oneWord) {
            compression = Mode.Hash;
            size = oneWord;
            chunk = keccak256(data);
        } else {
            compression = Mode.Uncompressed;
            size = oneWord;
            chunk = bytes32(data);
        }
    }

    function extract(
        bytes32 payload
    ) internal pure returns (bytes memory compValue) {
        uint256 size = (uint256(payload >> offsetSizeCompressed) & 0xff);
        uint256 length = uint256(payload >> offsetSizeExtracted) & 0xff;
        uint256 offset = uint256(payload >> offsetShift) & 0xff;

        uint256 sizePayload = size - headSize;
        bytes32 content = payload << (headSize * 8);

        compValue = new bytes(length);
        for (uint256 i; i < sizePayload; ++i) {
            compValue[i + offset] = content[i];
        }
    }

    // function _leadingZeroes(
    //     bytes32 compValue
    // ) private pure returns (uint256 result) {
    //     uint256 mask = 0xff << 248;
    //     for (; mask != 0; mask >>= 8) {
    //         if (uint256(compValue) & mask == 0) {
    //             ++result;
    //         } else {
    //             break;
    //         }
    //     }
    // }

    function _leadingZeroes(
        bytes calldata compValue
    ) private pure returns (uint256 result) {
        uint256 length = compValue.length;
        for (uint256 i; i < length; ++i) {
            if (compValue[i] == 0) {
                ++result;
            } else {
                break;
            }
        }
    }

    // function _trailingZeroes(
    //     bytes32 compValue
    // ) private pure returns (uint256 result) {
    //     uint256 mask = 0xff;
    //     for (; mask != 0; mask <<= 8) {
    //         if (uint256(compValue) & mask == 0) {
    //             ++result;
    //         } else {
    //             break;
    //         }
    //     }
    // }

    function _trailingZeroes(
        bytes calldata compValue
    ) private pure returns (uint256 result) {
        for (int i = int(compValue.length) - 1; i >= 0; --i) {
            if (compValue[uint256(i)] == 0) {
                ++result;
            } else {
                break;
            }
        }
    }
}
