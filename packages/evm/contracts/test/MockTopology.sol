// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../Topology.sol";

contract MockTopology {
    function typeTree(
        PL1[] calldata layout
    ) public pure returns (PP1[] memory) {
        return copyOut(Topology.typeTree(copyIn(layout)));
    }

    function copyIn(
        PL1[] calldata input
    ) private pure returns (ParameterConfig[] memory result) {
        result = new ParameterConfig[](input.length);
        for (uint256 i; i < input.length; i++) {
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL2[] calldata input
    ) private pure returns (ParameterConfig[] memory result) {
        result = new ParameterConfig[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL3[] calldata input
    ) private pure returns (ParameterConfig[] memory result) {
        result = new ParameterConfig[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL4[] calldata input
    ) private pure returns (ParameterConfig[] memory result) {
        result = new ParameterConfig[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL5[] calldata input
    ) private pure returns (ParameterConfig[] memory result) {
        result = new ParameterConfig[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
        }
    }

    function copyOut(
        TypeTopology[] memory output
    ) private pure returns (PP1[] memory result) {
        result = new PP1[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._type = output[i]._type;
            result[i].children = copyOutTo2(output[i].children);
        }
    }

    function copyOutTo2(
        TypeTopology[] memory output
    ) private pure returns (PP2[] memory result) {
        result = new PP2[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._type = output[i]._type;
            result[i].children = copyOutTo3(output[i].children);
        }
    }

    function copyOutTo3(
        TypeTopology[] memory output
    ) private pure returns (PP3[] memory result) {
        result = new PP3[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._type = output[i]._type;
            result[i].children = copyOutTo4(output[i].children);
        }
    }

    function copyOutTo4(
        TypeTopology[] memory output
    ) private pure returns (PP4[] memory result) {
        result = new PP4[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._type = output[i]._type;
            result[i].children = copyOutTo5(output[i].children);
        }
    }

    function copyOutTo5(
        TypeTopology[] memory output
    ) private pure returns (PP5[] memory result) {
        result = new PP5[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._type = output[i]._type;
        }
    }

    struct PL1 {
        ParameterType _type;
        Comparison comp;
        PL2[] children;
    }

    struct PL2 {
        ParameterType _type;
        Comparison comp;
        PL3[] children;
    }

    struct PL3 {
        ParameterType _type;
        Comparison comp;
        PL4[] children;
    }

    struct PL4 {
        ParameterType _type;
        Comparison comp;
        PL5[] children;
    }

    struct PL5 {
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
