// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./ConditionUnpacker.sol";
import "./TypeTreeUnpacker.sol";

import "../../Types.sol";

library FunctionUnpacker {
    function unpack(
        bytes memory buffer
    )
        internal
        view
        returns (
            Condition memory condition,
            TypeTree memory typeTree,
            bytes32[] memory allowanceKeys
        )
    {
        // Read header offsets (2 × 16 bits = 4 bytes)
        uint256 typesOffset = _mload16(buffer, 0);
        uint256 allowanceOffset = _mload16(buffer, 2);

        // Unpack condition tree
        condition = ConditionUnpacker.unpack(buffer, 4);

        // Unpack type tree
        typeTree = TypeTreeUnpacker.unpack(buffer, typesOffset);

        assembly {
            allowanceKeys := add(buffer, add(0x20, allowanceOffset))
        }
    }

    function _mload16(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256 value) {
        assembly {
            let ptr := add(add(buffer, 0x20), offset)
            value := shr(240, mload(ptr))
        }
    }
}
