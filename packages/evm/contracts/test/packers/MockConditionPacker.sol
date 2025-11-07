// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Types.sol";
import "../../function-store/packers/ConditionPacker.sol";

contract MockConditionPacker {
    function pack(
        ConditionFlat[] calldata flat
    ) external pure returns (bytes memory buffer) {
        uint256 size = ConditionPacker.packedSize(flat);
        buffer = new bytes(size);
        ConditionPacker.pack(flat, buffer, 0);
    }
}
