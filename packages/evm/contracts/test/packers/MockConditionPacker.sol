// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Types.sol";
import "../../function-store/FunctionPacker.sol";

contract MockConditionPacker {
    function pack(
        ConditionFlat[] calldata flat
    ) external pure returns (bytes memory buffer) {
        uint256 size = FunctionPacker._conditionPackedSize(flat);
        buffer = new bytes(size);
        FunctionPacker._packConditions(flat, buffer, 0);
    }
}
