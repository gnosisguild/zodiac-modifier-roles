// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../core/serialize/ConditionPacker.sol";
import "../../core/serialize/ConditionUnpacker.sol";
import "../../core/serialize/TypeTree.sol";

import "../../types/Types.sol";

contract MockPackerUnpacker {
    struct ConditionFlatOut {
        uint256 parent;
        Operator operator;
        bytes compValue;
    }

    struct LayoutFlatOut {
        uint256 parent;
        Encoding encoding;
    }

    function pack(
        ConditionFlat[] calldata conditions
    ) external pure returns (bytes memory buffer) {
        Layout memory layout = TypeTree.inspect(conditions, 0);
        return ConditionPacker.pack(conditions, layout);
    }

    function unpack(
        bytes memory buffer
    )
        external
        view
        returns (
            ConditionFlatOut[] memory conditionsOut,
            LayoutFlatOut[] memory layoutOut
        )
    {
        (Condition memory condition, Layout memory layout) = ConditionUnpacker
            .unpack(buffer);

        conditionsOut = _flattenCondition(condition);
        layoutOut = _flattenLayout(layout);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Condition Helpers
    // ═══════════════════════════════════════════════════════════════════════════

    function _flattenCondition(
        Condition memory root
    ) private pure returns (ConditionFlatOut[] memory flat) {
        uint256 nodeCount = _countConditionNodes(root);
        flat = new ConditionFlatOut[](nodeCount);

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

            bytes memory compValue;
            if (node.operator >= Operator.EqualTo) {
                compValue = bytes.concat(node.compValue);
            } else {
                compValue = "";
            }

            flat[bfsIndex] = ConditionFlatOut({
                parent: parent,
                operator: node.operator,
                compValue: compValue
            });

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

    function _countConditionNodes(
        Condition memory node
    ) private pure returns (uint256 count) {
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += _countConditionNodes(node.children[i]);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Layout Helpers
    // ═══════════════════════════════════════════════════════════════════════════

    function _flattenLayout(
        Layout memory root
    ) private pure returns (LayoutFlatOut[] memory result) {
        result = new LayoutFlatOut[](_countLayoutNodes(root));

        Layout[] memory queue = new Layout[](result.length);
        uint256[] memory parents = new uint256[](result.length);

        queue[0] = root;
        parents[0] = 0;

        uint256 head = 0;
        uint256 tail = 1;
        uint256 current = 0;

        while (head < tail) {
            Layout memory node = queue[head];
            uint256 parent = parents[head];
            head++;

            result[current] = LayoutFlatOut({
                encoding: node.encoding,
                parent: parent
            });

            for (uint256 i = 0; i < node.children.length; ++i) {
                queue[tail] = node.children[i];
                parents[tail] = current;
                tail++;
            }

            current++;
        }
    }

    function _countLayoutNodes(
        Layout memory root
    ) private pure returns (uint256 count) {
        count = 1;
        for (uint256 i; i < root.children.length; i++) {
            count += _countLayoutNodes(root.children[i]);
        }
    }
}
