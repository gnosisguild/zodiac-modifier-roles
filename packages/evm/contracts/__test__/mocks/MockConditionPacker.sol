// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../core/condition/ConditionPack.sol";

import "../../types/All.sol";

contract MockConditionPacker {
    function pack(
        ConditionFlat[] calldata flat
    ) external pure returns (bytes memory buffer) {
        uint256 size = ConditionPack._conditionPackedSize(flat);
        buffer = new bytes(size);
        ConditionPack._packConditions(flat, buffer, 0);
    }
}
