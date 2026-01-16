// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../core/serialize/Topology.sol";
import "../../core/serialize/TypeTree.sol";

contract MockTypeTree {
    struct FlatLayoutForTest {
        uint256 parent;
        Encoding encoding;
        uint256 leadingBytes;
        bool inlined;
    }

    function resolve(
        ConditionFlat[] memory conditions
    ) public pure returns (FlatLayoutForTest[] memory) {
        TopologyInfo[] memory info = Topology.resolve(conditions);
        return _flattenLayout(TypeTree.resolve(conditions, info, 0));
    }

    function _flattenLayout(
        Layout memory root
    ) internal pure returns (FlatLayoutForTest[] memory) {
        uint256 total = _countNodes(root);
        FlatLayoutForTest[] memory result = new FlatLayoutForTest[](total);

        Layout[] memory queue = new Layout[](total);
        uint256[] memory parents = new uint256[](total);

        queue[0] = root;
        parents[0] = 0;

        uint256 head = 0;
        uint256 tail = 1;
        uint256 current = 0;

        while (head < tail) {
            Layout memory node = queue[head];
            uint256 parent = parents[head];
            head++;

            result[current] = FlatLayoutForTest({
                parent: parent,
                encoding: node.encoding,
                leadingBytes: node.leadingBytes,
                inlined: node.inlined
            });

            for (uint256 i = 0; i < node.children.length; ++i) {
                queue[tail] = node.children[i];
                parents[tail] = current;
                tail++;
            }

            current++;
        }

        return result;
    }

    function _countNodes(
        Layout memory node
    ) private pure returns (uint256 count) {
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += _countNodes(node.children[i]);
        }
    }
}
