// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Topology.sol";
import "../AbiDecoder.sol";

contract MockDecoder {
    function inspect(
        bytes calldata data,
        ConditionFlat[] memory conditions
    ) public pure returns (PP1 memory r) {
        return
            copyOut(
                AbiDecoder.inspect(
                    data,
                    Topology.typeTree(
                        conditions,
                        0,
                        Topology.childrenBounds(conditions)
                    ),
                    0
                )
            );
    }

    function inspectRaw(
        bytes calldata data,
        AbiTypeTree[] memory typeTree
    ) public pure returns (PP1 memory r) {
        return copyOut(AbiDecoder.inspect(data, typeTree, 0));
    }

    function pluck(
        bytes calldata data,
        uint256 offset,
        uint256 size
    ) public pure returns (bytes memory result) {
        return AbiDecoder.pluck(data, offset, size);
    }

    function copyOut(
        Payload memory output
    ) private pure returns (PP1 memory result) {
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
        result.location = output.location;
        result.size = output.size;
        if (output.children.length > 0) {
            revert("MockDecoder needs more levels of recursion");
        }
    }

    struct PP1 {
        uint256 location;
        uint256 size;
        PP2[] children;
    }

    struct PP2 {
        uint256 location;
        uint256 size;
        PP3[] children;
    }

    struct PP3 {
        uint256 location;
        uint256 size;
        PP4[] children;
    }

    struct PP4 {
        uint256 location;
        uint256 size;
        PP5[] children;
    }

    struct PP5 {
        uint256 location;
        uint256 size;
        PP6[] children;
    }

    struct PP6 {
        uint256 location;
        uint256 size;
    }
}
