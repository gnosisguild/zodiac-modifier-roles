// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library Compression {
    enum Mode {
        Empty,
        UncompressedWord,
        Uncompressed,
        Compressed,
        Hash
    }

    uint256 private constant offsetLength = 248;
    uint256 private constant offsetLeftPad = 240;
    uint256 private constant offsetRightPad = 232;

    uint256 private constant oneWord = 32;
    uint256 private constant headSize = 3;

    function compress(
        bytes calldata data
    )
        internal
        pure
        returns (Mode compression, uint256 resultLength, bytes32 result)
    {
        // buffer too large
        uint256 length = data.length;
        if (length > 255) {
            return (Mode.Hash, oneWord, keccak256(data));
        }

        uint256 leftPad = _leadingZeroes(data);
        // buffer only zeroes
        if (leftPad == length) {
            return (
                Mode.Compressed,
                headSize,
                (bytes32((headSize - 1) << offsetLength) |
                    bytes32(leftPad << offsetLeftPad))
            );
        }
        uint256 rightPad = _trailingZeroes(data);

        uint256 contentLength = length - (leftPad + rightPad);
        uint256 payloadLength = contentLength + headSize - 1;
        uint256 compressedLength = contentLength + headSize;

        if (compressedLength < oneWord) {
            compression = Mode.Compressed;
            resultLength = compressedLength;
            result =
                bytes32(payloadLength << offsetLength) |
                bytes32(leftPad << offsetLeftPad) |
                bytes32(rightPad << offsetRightPad) |
                (bytes32(data[leftPad:length - rightPad]) >> (headSize * 8));
        } else if (length > oneWord) {
            compression = Mode.Hash;
            resultLength = oneWord;
            result = keccak256(data);
        } else if (length == oneWord) {
            compression = Mode.UncompressedWord;
            resultLength = oneWord;
            result = bytes32(data);
        } else {
            compression = Mode.Uncompressed;
            resultLength = length;
            result = bytes1(uint8(length)) | (bytes32(data) >> 8);
        }
    }

    function extract(
        bytes32 payload
    ) internal pure returns (bytes memory compValue) {
        uint256 payloadLength = (uint256(payload >> offsetLength) & 0xff);
        uint256 leftPad = uint256(payload >> offsetLeftPad) & 0xff;
        uint256 rightPad = uint256(payload >> offsetRightPad) & 0xff;
        bytes32 content = payload << (headSize * 8);

        uint256 contentLength = payloadLength - (headSize - 1);
        uint256 length = leftPad + contentLength + rightPad;

        compValue = new bytes(length);
        for (uint256 i; i < contentLength; ++i) {
            compValue[i + leftPad] = content[i];
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
