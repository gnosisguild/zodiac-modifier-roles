// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/AbiDecoder.sol";
import "../../core/serialize/TypeTree.sol";

contract MockDecoder {
    function inspect(
        bytes calldata data,
        ConditionFlat[] memory conditions
    ) public pure returns (PP1 memory r) {
        return
            copyOut(AbiDecoder.inspect(data, TypeTree.inspect(conditions, 0)));
    }

    function inspectFlat(
        bytes calldata data,
        ConditionFlat[] memory conditions
    ) public pure returns (FlatPayload[] memory) {
        return
            flattenTree(
                AbiDecoder.inspect(data, TypeTree.inspect(conditions, 0))
            );
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
    ) internal pure returns (FlatPayload[] memory) {
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

    function copyOut(
        Payload memory output
    ) private pure returns (PP1 memory result) {
        result.inlined = output.inlined;
        result.variant = output.variant;
        result.overflow = output.overflow;
        result.location = output.location;
        result.size = output.size;
        result.children = new PP2[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo2(output.children[i]);
        }
    }

    function copyOutTo2(
        Payload memory output
    ) private pure returns (PP2 memory result) {
        result.inlined = output.inlined;
        result.variant = output.variant;
        result.overflow = output.overflow;
        result.location = output.location;
        result.size = output.size;
        result.children = new PP3[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo3(output.children[i]);
        }
    }

    function copyOutTo3(
        Payload memory output
    ) private pure returns (PP3 memory result) {
        result.inlined = output.inlined;
        result.variant = output.variant;
        result.overflow = output.overflow;
        result.location = output.location;
        result.size = output.size;
        result.children = new PP4[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo4(output.children[i]);
        }
    }

    function copyOutTo4(
        Payload memory output
    ) private pure returns (PP4 memory result) {
        result.inlined = output.inlined;
        result.variant = output.variant;
        result.overflow = output.overflow;
        result.location = output.location;
        result.size = output.size;
        result.children = new PP5[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo5(output.children[i]);
        }
    }

    function copyOutTo5(
        Payload memory output
    ) private pure returns (PP5 memory result) {
        result.inlined = output.inlined;
        result.variant = output.variant;
        result.overflow = output.overflow;
        result.location = output.location;
        result.size = output.size;
        result.children = new PP6[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo6(output.children[i]);
        }
    }

    function copyOutTo6(
        Payload memory output
    ) private pure returns (PP6 memory result) {
        result.inlined = output.inlined;
        result.variant = output.variant;
        result.overflow = output.overflow;
        result.location = output.location;
        result.size = output.size;
        if (output.children.length > 0) {
            revert("MockDecoder needs more levels of recursion");
        }
    }

    struct PP1 {
        bool inlined;
        bool variant;
        bool overflow;
        uint256 location;
        uint256 size;
        PP2[] children;
    }

    struct PP2 {
        bool inlined;
        bool variant;
        bool overflow;
        uint256 location;
        uint256 size;
        PP3[] children;
    }

    struct PP3 {
        bool inlined;
        bool variant;
        bool overflow;
        uint256 location;
        uint256 size;
        PP4[] children;
    }

    struct PP4 {
        bool inlined;
        bool variant;
        bool overflow;
        uint256 location;
        uint256 size;
        PP5[] children;
    }

    struct PP5 {
        bool inlined;
        bool variant;
        bool overflow;
        uint256 location;
        uint256 size;
        PP6[] children;
    }

    struct PP6 {
        bool inlined;
        bool variant;
        bool overflow;
        uint256 location;
        uint256 size;
    }
}
