// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

library ExtCodeCopy {
    function load(address pointer) internal view returns (bytes memory buffer) {
        // jump over the prepended 00, so sub 1 byte
        uint256 size;
        assembly {
            size := sub(extcodesize(pointer), 1)
        }

        buffer = new bytes(size);
        assembly {
            extcodecopy(pointer, add(buffer, 0x20), 0x01, size)
        }
    }
}
