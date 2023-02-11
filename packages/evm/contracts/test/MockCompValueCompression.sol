// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../bitmaps/CompValueCompression.sol";

contract MockCompValueCompression {
    function compressBytes32(
        bytes32 compValue
    )
        public
        view
        returns (Compression compression, uint256 size, bytes32 result)
    {
        return CompValueCompression.compress(compValue);
    }

    function compressBytes(
        bytes calldata compValue
    )
        public
        view
        returns (Compression compression, uint256 size, bytes32 result)
    {
        return CompValueCompression.compress(compValue);
    }
}
