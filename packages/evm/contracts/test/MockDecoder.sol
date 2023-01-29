// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../Decoder.sol";

contract MockDecoder {
    function pluckParameters(
        bytes calldata data,
        PL1[] calldata layout
    ) public pure returns (PP1[] memory) {
        return copyOut(Decoder.pluckParameters(data, copyIn(layout)));
    }

    function copyIn(
        PL1[] calldata input
    ) private pure returns (ParameterConfig[] memory result) {
        result = new ParameterConfig[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
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
            result[i].isScoped = input[i].isScoped;
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
            result[i].isScoped = input[i].isScoped;
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
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
        }
    }

    function copyOut(
        ParameterPayload[] memory output
    ) private pure returns (PP1[] memory result) {
        result = new PP1[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._static = output[i]._static;
            result[i].dynamic = output[i].dynamic;
            result[i].dynamic32 = output[i].dynamic32;
            result[i].children = copyOutTo2(output[i].children);
        }
    }

    function copyOutTo2(
        ParameterPayload[] memory output
    ) private pure returns (PP2[] memory result) {
        result = new PP2[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._static = output[i]._static;
            result[i].dynamic = output[i].dynamic;
            result[i].dynamic32 = output[i].dynamic32;
            result[i].children = copyOutTo3(output[i].children);
        }
    }

    function copyOutTo3(
        ParameterPayload[] memory output
    ) private pure returns (PP3[] memory result) {
        result = new PP3[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._static = output[i]._static;
            result[i].dynamic = output[i].dynamic;
            result[i].dynamic32 = output[i].dynamic32;
            result[i].children = copyOutTo4(output[i].children);
        }
    }

    function copyOutTo4(
        ParameterPayload[] memory output
    ) private pure returns (PP4[] memory result) {
        result = new PP4[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i]._static = output[i]._static;
            result[i].dynamic = output[i].dynamic;
            result[i].dynamic32 = output[i].dynamic32;
        }
    }

    struct PL1 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        PL2[] children;
    }

    struct PL2 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        PL3[] children;
    }

    struct PL3 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        PL4[] children;
    }

    struct PL4 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
    }

    struct PP1 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
        PP2[] children;
    }

    struct PP2 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
        PP3[] children;
    }

    struct PP3 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
        PP4[] children;
    }

    struct PP4 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
    }
}
