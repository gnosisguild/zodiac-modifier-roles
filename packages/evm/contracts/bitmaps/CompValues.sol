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
            uint256 size,
            bytes32 payload
        ) = Compression.compress(parameter.compValue);

        BufferPacker.pack(buffer, offset, size, payload);

        return (compression, offset + size);
    }

    function unpack(
        BitmapBuffer memory buffer,
        ParameterType _type,
        Compression.Mode compression,
        uint256 offset
    ) internal pure returns (bytes32) {
        if (compression == Compression.Mode.Empty) {
            return 0;
        }

        uint256 size = packedSize(buffer, compression, offset);
        bytes32 payload = BufferPacker.unpack(buffer, offset, size);

        if (compression == Compression.Mode.Compressed) {
            if (_type == ParameterType.Static) {
                return bytes32(Compression.extract(payload));
            } else {
                return keccak256(Compression.extract(payload));
            }
        } else if (compression == Compression.Mode.Uncompressed) {
            if (_type == ParameterType.Static) {
                return payload;
            } else {
                return keccak256(abi.encodePacked(payload));
            }
        } else {
            assert(compression == Compression.Mode.Hash);
            return payload;
        }
    }

    function packedSize(
        BitmapBuffer memory buffer,
        Compression.Mode compression,
        uint256 offset
    ) internal pure returns (uint256 result) {
        if (compression == Compression.Mode.Empty) {
            return 0;
        } else if (
            compression == Compression.Mode.Uncompressed ||
            compression == Compression.Mode.Hash
        ) {
            return 32;
        } else {
            return uint8(BufferPacker.unpackByte(buffer, offset));
        }
    }

    function _shouldPack(Comparison comp) private pure returns (bool) {
        return
            comp == Comparison.EqualTo ||
            comp == Comparison.GreaterThan ||
            comp == Comparison.LessThan;
    }
}
