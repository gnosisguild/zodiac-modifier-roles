// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../bitmaps/Compression.sol";

contract MockCompression {
    function compressWord(
        bytes32 compValue
    )
        public
        pure
        returns (Compression.Mode compression, uint256 size, bytes32 result)
    {
        return Compression.compressWord(compValue);
    }

    function compressBytes(
        bytes calldata compValue
    )
        public
        pure
        returns (Compression.Mode compression, uint256 size, bytes32 result)
    {
        return Compression.compressBytes(compValue);
    }

    function extractWord(
        bytes32 payload
    ) public pure returns (bytes32 compValue) {
        return Compression.extractWord(payload);
    }

    function extractBytes(
        bytes32 payload
    ) public pure returns (bytes memory compValue) {
        return Compression.extractBytes(payload);
    }
}
