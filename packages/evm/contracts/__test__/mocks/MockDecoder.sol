// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AbiDecoder.sol";
import "../../core/serialize/ConditionPacker.sol";
import "../../core/serialize/ConditionUnpacker.sol";
import "../../core/serialize/ConditionTransform.sol";
import "../../core/serialize/Integrity.sol";
import "../../core/serialize/Topology.sol";

contract MockDecoder {
    function inspect(
        bytes calldata data,
        ConditionFlat[] memory conditions
    ) public view returns (FlatPayload[] memory) {
        Topology[] memory topology = TopologyLib.resolve(conditions);
        Integrity.enforce(conditions, topology);
        ConditionTransform.transform(conditions, topology);
        bytes memory packed = ConditionPacker.pack(conditions, topology);
        (, Layout memory layout, ) = ConditionUnpacker.unpack(packed);
        return flattenTree(AbiDecoder.inspect(data, layout));
    }

    function pluck(
        bytes calldata data,
        uint256 offset,
        uint256 size
    ) public pure returns (bytes calldata) {
        return data[offset:offset + size];
    }

    struct FlatPayload {
        uint256 parent;
        uint256 location;
        uint256 size;
        bool inlined;
        bool variant;
        bool overflow;
    }

    function flattenTree(
        Payload memory root
    ) private pure returns (FlatPayload[] memory) {
        FlatPayload[] memory result = new FlatPayload[](countNodes(root));
        _flatten(root, 0, 0, result);
        return result;
    }

    function _flatten(
        Payload memory node,
        uint256 index,
        uint256 parent,
        FlatPayload[] memory result
    ) private pure returns (uint256 next) {
        result[index] = FlatPayload({
            parent: parent,
            location: node.location,
            size: node.size,
            inlined: node.inlined,
            variant: node.variant,
            overflow: node.overflow
        });

        next = index + 1;
        for (uint256 i = 0; i < node.children.length; i++) {
            next = _flatten(node.children[i], next, index, result);
        }
        return next;
    }

    function countNodes(Payload memory tree) private pure returns (uint256) {
        uint256 count;

        for (uint256 i = 0; i < tree.children.length; i++) {
            count += countNodes(tree.children[i]);
        }

        return count + 1;
    }
}
