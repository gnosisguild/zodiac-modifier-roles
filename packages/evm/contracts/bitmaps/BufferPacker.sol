// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library BufferPacker {
    uint256 private constant offsetPage = 251;
    bytes32 private constant pageMask = bytes32(uint256(0x1f << 251));

    function pack(
        BitmapBuffer memory buffer,
        uint256 offset,
        uint256 size,
        bytes32 payload
    ) internal pure {
        assert(size <= 32);
        (
            uint256 page,
            uint256 index,
            uint256 bitsPage1,
            uint256 bitsPage2
        ) = _plan(offset, size);

        buffer.payload[page] |= payload >> (index * 8);
        if (bitsPage2 > 0) {
            buffer.payload[page + 1] |= payload << bitsPage1;
        }

        uint256 pageCount = bitsPage2 > 0 ? page + 2 : page + 1;

        buffer.payload[0] =
            (buffer.payload[0] & ~pageMask) |
            bytes32(pageCount << offsetPage);
    }

    function unpack(
        BitmapBuffer memory buffer,
        uint256 offset,
        uint256 size
    ) internal pure returns (bytes32 result) {
        assert(size <= 32);
        (
            uint256 page,
            uint256 index,
            uint256 bitsPage1,
            uint256 bitsPage2
        ) = _plan(offset, size);

        result = (buffer.payload[page] << (index * 8)) & _mask(bitsPage1);
        if (bitsPage2 > 0) {
            result |=
                (buffer.payload[page + 1] & _mask(bitsPage2)) >>
                bitsPage1;
        }
    }

    function unpackByte(
        BitmapBuffer memory buffer,
        uint256 offset
    ) internal pure returns (bytes1 result) {
        uint256 page = offset / 32;
        uint256 index = offset % 32;
        return bytes1(buffer.payload[page] << (index * 8));
    }

    function _plan(
        uint256 offset,
        uint256 size
    )
        private
        pure
        returns (
            uint256 page,
            uint256 index,
            uint256 bitCount1stPage,
            uint256 bitCount2ndPage
        )
    {
        page = offset / 32;
        index = offset % 32;
        uint256 sizeAvailable = 32 - index;
        (bitCount1stPage, bitCount2ndPage) = size < sizeAvailable
            ? (size * 8, 0)
            : (sizeAvailable * 8, (size - sizeAvailable) * 8);
    }

    function _mask(uint256 bitCount) private pure returns (bytes32) {
        return bytes32((1 << bitCount) - 1) << (256 - bitCount);
    }
}
