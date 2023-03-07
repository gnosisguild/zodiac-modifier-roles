// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../Topology.sol";

contract MockTopology {
    function typeTree(PC1 calldata layout) public pure returns (PP1 memory) {
        return copyOut(Topology.typeTree(copyIn(layout)));
    }

    function copyIn(
        PC1 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC2 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC3 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC4 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC5 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result._type = input._type;
        result.comp = input.comp;
    }

    function copyOut(
        TypeTopology memory output
    ) private pure returns (PP1 memory result) {
        result._type = output._type;
        result.children = new PP2[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo2(output.children[i]);
        }
    }

    function copyOutTo2(
        TypeTopology memory output
    ) private pure returns (PP2 memory result) {
        result._type = output._type;
        result.children = new PP3[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo3(output.children[i]);
        }
    }

    function copyOutTo3(
        TypeTopology memory output
    ) private pure returns (PP3 memory result) {
        result._type = output._type;
        result.children = new PP4[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo4(output.children[i]);
        }
    }

    function copyOutTo4(
        TypeTopology memory output
    ) private pure returns (PP4 memory result) {
        result._type = output._type;
        result.children = new PP5[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo5(output.children[i]);
        }
    }

    function copyOutTo5(
        TypeTopology memory output
    ) private pure returns (PP5 memory result) {
        result._type = output._type;
    }

    struct PC1 {
        ParameterType _type;
        Comparison comp;
        PC2[] children;
    }

    struct PC2 {
        ParameterType _type;
        Comparison comp;
        PC3[] children;
    }

    struct PC3 {
        ParameterType _type;
        Comparison comp;
        PC4[] children;
    }

    struct PC4 {
        ParameterType _type;
        Comparison comp;
        PC5[] children;
    }

    struct PC5 {
        ParameterType _type;
        Comparison comp;
    }

    struct PP1 {
        ParameterType _type;
        PP2[] children;
    }

    struct PP2 {
        ParameterType _type;
        PP3[] children;
    }

    struct PP3 {
        ParameterType _type;
        PP4[] children;
    }

    struct PP4 {
        ParameterType _type;
        PP5[] children;
    }

    struct PP5 {
        ParameterType _type;
    }
}
