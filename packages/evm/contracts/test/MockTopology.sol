// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../Topology.sol";

contract MockTopology {
    function typeTree(PC1 calldata layout) public pure returns (PP1 memory) {
        return copyOut(Topology.typeTree(copyIn(layout)));
    }

    function copyIn(
        PC1 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC2 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC3 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC4 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < result.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PC5 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
    }

    function copyOut(
        TypeTopology memory output
    ) private pure returns (PP1 memory result) {
        result.paramType = output.paramType;
        result.children = new PP2[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo2(output.children[i]);
        }
    }

    function copyOutTo2(
        TypeTopology memory output
    ) private pure returns (PP2 memory result) {
        result.paramType = output.paramType;
        result.children = new PP3[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo3(output.children[i]);
        }
    }

    function copyOutTo3(
        TypeTopology memory output
    ) private pure returns (PP3 memory result) {
        result.paramType = output.paramType;
        result.children = new PP4[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo4(output.children[i]);
        }
    }

    function copyOutTo4(
        TypeTopology memory output
    ) private pure returns (PP4 memory result) {
        result.paramType = output.paramType;
        result.children = new PP5[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo5(output.children[i]);
        }
    }

    function copyOutTo5(
        TypeTopology memory output
    ) private pure returns (PP5 memory result) {
        result.paramType = output.paramType;
    }

    struct PC1 {
        ParameterType paramType;
        Operator operator;
        PC2[] children;
    }

    struct PC2 {
        ParameterType paramType;
        Operator operator;
        PC3[] children;
    }

    struct PC3 {
        ParameterType paramType;
        Operator operator;
        PC4[] children;
    }

    struct PC4 {
        ParameterType paramType;
        Operator operator;
        PC5[] children;
    }

    struct PC5 {
        ParameterType paramType;
        Operator operator;
    }

    struct PP1 {
        ParameterType paramType;
        PP2[] children;
    }

    struct PP2 {
        ParameterType paramType;
        PP3[] children;
    }

    struct PP3 {
        ParameterType paramType;
        PP4[] children;
    }

    struct PP4 {
        ParameterType paramType;
        PP5[] children;
    }

    struct PP5 {
        ParameterType paramType;
    }
}
