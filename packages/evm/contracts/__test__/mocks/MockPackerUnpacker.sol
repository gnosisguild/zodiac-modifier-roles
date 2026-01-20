// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../core/serialize/ConditionPacker.sol";
import "../../core/serialize/ConditionUnpacker.sol";
import "../../core/serialize/ConditionTransform.sol";
import "../../core/serialize/Integrity.sol";
import "../../core/serialize/Topology.sol";

contract MockPackerUnpacker {
    struct FlatConditionForTest {
        uint256 parent;
        Operator operator;
        bytes compValue;
        uint256 sChildCount;
    }

    struct FlatLayoutForTest {
        uint256 parent;
        Encoding encoding;
        uint256 leadingBytes;
        bool inlined;
    }

    function roundtrip(
        ConditionFlat[] memory conditions
    )
        public
        view
        returns (
            FlatConditionForTest[] memory flatConditions,
            FlatLayoutForTest[] memory flatLayouts,
            uint256 maxPluckValueCount
        )
    {
        // Pack
        Topology[] memory topology = TopologyLib.resolve(conditions);
        Integrity.enforce(conditions, topology);
        ConditionTransform.transform(conditions, topology);
        bytes memory buffer = ConditionPacker.pack(conditions, topology);

        // Unpack
        (
            Condition memory condition,
            Layout memory layout,
            uint256 maxCount
        ) = ConditionUnpacker.unpack(buffer);

        // Flatten both to BFS order
        flatConditions = _flattenCondition(condition);
        flatLayouts = _flattenLayout(layout);
        maxPluckValueCount = maxCount;
    }

    function _flattenCondition(
        Condition memory root
    ) internal pure returns (FlatConditionForTest[] memory) {
        uint256 total = _countConditionNodes(root);
        FlatConditionForTest[] memory result = new FlatConditionForTest[](
            total
        );

        Condition[] memory queue = new Condition[](total);
        uint256[] memory parents = new uint256[](total);

        queue[0] = root;
        parents[0] = 0;

        uint256 head = 0;
        uint256 tail = 1;
        uint256 current = 0;

        while (head < tail) {
            Condition memory node = queue[head];
            uint256 parent = parents[head];
            head++;

            result[current] = FlatConditionForTest({
                parent: parent,
                operator: node.operator,
                compValue: node.compValue,
                sChildCount: node.sChildCount
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

    function _countConditionNodes(
        Condition memory node
    ) private pure returns (uint256 count) {
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += _countConditionNodes(node.children[i]);
        }
    }

    function _flattenLayout(
        Layout memory root
    ) internal pure returns (FlatLayoutForTest[] memory) {
        uint256 total = _countLayoutNodes(root);
        FlatLayoutForTest[] memory result = new FlatLayoutForTest[](total);

        if (total == 0) return result;

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

    function _countLayoutNodes(
        Layout memory node
    ) private pure returns (uint256 count) {
        // Empty layout (non-structural tree) has no nodes
        if (node.encoding == Encoding.None) {
            return 0;
        }
        count = 1;
        for (uint256 i = 0; i < node.children.length; ++i) {
            count += _countLayoutNodes(node.children[i]);
        }
    }
}
