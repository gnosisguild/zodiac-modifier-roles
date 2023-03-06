// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../bitmaps/Compression.sol";

contract MockCompression {
    function compress(
        bytes calldata compValue
    )
        public
        pure
        returns (
            Compression.Mode compression,
            uint256 resultLength,
            bytes32 result
        )
    {
        return Compression.compress(compValue);
    }

    function extract(
        bytes32 payload
    ) public pure returns (bytes memory compValue) {
        return Compression.extract(payload);
    }
}
