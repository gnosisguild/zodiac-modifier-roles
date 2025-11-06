// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Types.sol";

import "./ConditionUnpacker.sol";
import "./TypeTreeUnpacker.sol";

library ScopedFunctionUnpacker {
    function unpack(
        bytes memory buffer
    )
        internal
        pure
        returns (
            Condition memory condition,
            TypeTree memory typeTree,
            bytes32[] memory allowanceKeys,
            uint256 avatarCount
        )
    {
        // Read header offsets (3 × 16 bits = 6 bytes)
        uint256 typesOffset = _mload16(buffer, 0);
        uint256 allowanceOffset = _mload16(buffer, 2);
        avatarCount = _mload16(buffer, 4);

        // Unpack condition tree
        condition = ConditionUnpacker.unpack(buffer, 6);

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
