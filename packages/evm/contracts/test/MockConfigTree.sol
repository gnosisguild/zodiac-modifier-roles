// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../ConfigTree.sol";

contract MockConfigTree {
    function create(
        ParameterConfig2[] calldata parameters
    ) external pure returns (PL1[] memory) {
        return copy(ConfigTree.create(parameters));
    }

    function createNoCopy(
        ParameterConfig2[] calldata parameters
    ) external pure {
        ConfigTree.create(parameters);
    }

    function copy(
        ParameterConfigTree[] memory input
    ) private pure returns (PL1[] memory result) {
        result = new PL1[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].compValues = input[i].compValues;
            result[i].children = copy2(input[i].children);
        }
    }

    function copy2(
        ParameterConfigTree[] memory input
    ) private pure returns (PL2[] memory result) {
        result = new PL2[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].compValues = input[i].compValues;
            result[i].children = copy3(input[i].children);
        }
    }

    function copy3(
        ParameterConfigTree[] memory input
    ) private pure returns (PL3[] memory result) {
        result = new PL3[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].compValues = input[i].compValues;
            result[i].children = copy4(input[i].children);
        }
    }

    function copy4(
        ParameterConfigTree[] memory input
    ) private pure returns (PL4[] memory result) {
        result = new PL4[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].compValues = input[i].compValues;
        }
    }

    struct PL1 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        bytes[] compValues;
        PL2[] children;
    }

    struct PL2 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        bytes[] compValues;
        PL3[] children;
    }

    struct PL3 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        bytes[] compValues;
        PL4[] children;
    }

    struct PL4 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        bytes[] compValues;
    }
}
