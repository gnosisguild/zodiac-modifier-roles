// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";
import "./BufferPacker.sol";
import "./Compression.sol";

library CompValues {
    uint256 private constant offsetPage = 251;
    bytes32 private constant pageMask = bytes32(uint256(0xff << 248));

    function create(
        uint256 length
    ) internal pure returns (BitmapBuffer memory compValues) {
        uint256 maxPageCount = length + 1;
        compValues.payload = new bytes32[](maxPageCount);
    }

    function pack(
        BitmapBuffer memory buffer,
        ParameterConfigFlat calldata parameter,
        uint256 offset
    ) internal pure returns (Compression.Mode, uint256) {
        if (!_shouldPack(parameter.comp)) {
            return (Compression.Mode.Empty, offset);
        }

        (
            Compression.Mode compression,
            uint256 length,
            bytes32 result
        ) = Compression.compress(parameter.compValue);

        BufferPacker.pack(buffer, offset, length, result);

        return (compression, offset + length);
    }

    function unpack(
        BitmapBuffer memory buffer,
        uint256 offset,
        Compression.Mode compression
    )
        internal
        pure
        returns (bytes32 result, bool isHashed, uint256 nextOffset)
    {
        if (compression == Compression.Mode.Empty) {
            return (result, false, offset);
        }

        uint256 size = packedSize(buffer, compression, offset);
        bytes32 payload = BufferPacker.unpack(buffer, offset, size);

        if (compression == Compression.Mode.UncompressedWord) {
            result = payload;
        } else if (compression == Compression.Mode.Uncompressed) {
            result = payload << 8;
        } else if (compression == Compression.Mode.Compressed) {
            bytes memory compValue = Compression.extract(payload);
            isHashed = compValue.length > 32;
            result = isHashed ? keccak256(compValue) : bytes32(compValue);
        } else {
            assert(compression == Compression.Mode.Hash);
            isHashed = true;
            result = payload;
        }
        nextOffset = offset + size;
    }

    function packedSize(
        BitmapBuffer memory buffer,
        Compression.Mode compression,
        uint256 offset
    ) internal pure returns (uint256 result) {
        if (compression == Compression.Mode.Empty) {
            return 0;
        } else if (
            compression == Compression.Mode.UncompressedWord ||
            compression == Compression.Mode.Hash
        ) {
            return 32;
        } else {
            return uint8(BufferPacker.unpackByte(buffer, offset)) + 1;
        }
    }

    function _shouldPack(Comparison comp) private pure returns (bool) {
        return
            comp == Comparison.EqualTo ||
            comp == Comparison.GreaterThan ||
            comp == Comparison.LessThan ||
            comp == Comparison.WithinLimit ||
            comp == Comparison.Bytemask;
    }
}
