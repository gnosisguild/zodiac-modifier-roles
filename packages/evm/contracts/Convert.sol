// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./AbiTypes.sol";

library Convert {
    function toTree(
        TypeTreeFlat[] calldata flatTree,
        uint256 index
    ) internal pure returns (TypeTree memory result) {
        result._type = flatTree[index]._type;
        result.bfsIndex = index;
        if (flatTree[index].fields.length > 0) {
            uint256[] memory fields = flatTree[index].fields;
            result.children = new TypeTree[](fields.length);
            for (uint256 i = 0; i < fields.length; i++) {
                result.children[i] = toTree(flatTree, fields[i]);
            }
        }
    }
}
