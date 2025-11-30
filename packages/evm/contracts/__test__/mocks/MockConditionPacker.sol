// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../core/serialize/ConditionPacker.sol";

import {ConditionFlat} from "../../types/Condition.sol";

contract MockConditionPacker {
    function pack(
        ConditionFlat[] calldata flat
    ) external pure returns (bytes memory buffer) {
        uint256 size = ConditionPacker._conditionPackedSize(flat);
        buffer = new bytes(size);
        ConditionPacker._packConditions(flat, buffer, 0);
    }
}
