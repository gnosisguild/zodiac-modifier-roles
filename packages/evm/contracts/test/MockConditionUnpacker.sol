// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../scoped-function/deserialize/Unpacker.sol";

import "../Types.sol";

contract MockConditionUnpacker {
    function unpack(
        bytes memory buffer
    ) external view returns (ConditionFlat[] memory flat) {
        Condition memory root = Unpacker._unpackCondition(buffer, 0);
        return _flatten(root);
    }

    function _flatten(
        Condition memory root
    ) private pure returns (ConditionFlat[] memory flat) {
        uint256 nodeCount = _countNodes(root);
        flat = new ConditionFlat[](nodeCount);

        // BFS traversal using queue
        Condition[] memory queue = new Condition[](nodeCount);
        uint256[] memory parents = new uint256[](nodeCount);

        queue[0] = root;
        parents[0] = 0;
        uint256 queueHead = 0;
        uint256 queueTail = 1;
        uint256 bfsIndex = 0;

        while (queueHead < queueTail) {
            Condition memory node = queue[queueHead];
            uint256 parent = parents[queueHead];
            queueHead++;

            // Only include compValue for operators that need it
            bytes memory compValue;
            if (node.operator >= Operator.EqualTo) {
                compValue = bytes.concat(node.compValue);
            } else {
                compValue = "";
            }

            flat[bfsIndex] = ConditionFlat({
                parent: uint8(parent),
                paramType: node.encoding,
                operator: node.operator,
                compValue: compValue
            });

            // Enqueue children
            for (uint256 i = 0; i < node.children.length; ) {
                queue[queueTail] = node.children[i];
                parents[queueTail] = bfsIndex;
                queueTail++;

                unchecked {
                    ++i;
                }
            }

            bfsIndex++;
        }
    }

    function _countNodes(
        Condition memory node
    ) private pure returns (uint256 count) {
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += _countNodes(node.children[i]);
        }
    }
}
