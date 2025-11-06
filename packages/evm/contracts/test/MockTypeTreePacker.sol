// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../AbiTypes.sol";
import "../packers/TypeTreePacker.sol";

contract MockTypeTreePacker {
    struct InputFlat {
        AbiType _type;
        uint256 parent;
    }
    function packFlat(
        InputFlat[] calldata flatNodes
    ) external pure returns (bytes memory buffer) {
        uint256 size = TypeTreePacker.packedSize(_toTree(flatNodes, 0));
        buffer = new bytes(size);
        TypeTreePacker.pack(_toTree(flatNodes, 0), buffer, 0);
    }

    function _toTree(
        InputFlat[] calldata flatNodes,
        uint256 index
    ) private pure returns (TypeTree memory node) {
        node._type = flatNodes[index]._type;
        node.index = index;
        (uint256 start, uint256 length) = childBounds(flatNodes, index);

        if (length == 0) {
            return node;
        }
        node.children = new TypeTree[](length);

        for (uint256 i; i < length; i++) {
            node.children[i] = _toTree(flatNodes, start + i);
        }
    }

    function childBounds(
        InputFlat[] calldata flatNodes,
        uint256 index
    ) internal pure returns (uint256 start, uint256 length) {
        for (uint256 i = index + 1; i < flatNodes.length; ++i) {
            uint256 parent = flatNodes[i].parent;

            if (parent == index) {
                if (length == 0) start = i;
                ++length;
            } else if (parent > index) {
                break;
            }
        }
    }
}
