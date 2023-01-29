// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../Decoder.sol";

contract MockDecoder {
    function pluckParameters(
        bytes calldata data,
        PL1 calldata layout
    ) public pure returns (PP1 memory) {
        return copyOut(Decoder.pluckParameters(data, copyIn(layout)));
    }

    function copyIn(
        PL1 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result.isScoped = input.isScoped;
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i = 0; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL2 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result.isScoped = input.isScoped;
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i = 0; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL3 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result.isScoped = input.isScoped;
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i = 0; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL4 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result.isScoped = input.isScoped;
        result._type = input._type;
        result.comp = input.comp;
        result.children = new ParameterConfig[](input.children.length);
        for (uint256 i = 0; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL5 calldata input
    ) private pure returns (ParameterConfig memory result) {
        result.isScoped = input.isScoped;
        result._type = input._type;
        result.comp = input.comp;
    }

    function copyOut(
        ParameterPayload memory output
    ) private pure returns (PP1 memory result) {
        result._static = output._static;
        result.dynamic = output.dynamic;
        result.dynamic32 = output.dynamic32;

        result.children = new PP2[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo2(output.children[i]);
        }
    }

    function copyOutTo2(
        ParameterPayload memory output
    ) private pure returns (PP2 memory result) {
        result._static = output._static;
        result.dynamic = output.dynamic;
        result.dynamic32 = output.dynamic32;

        result.children = new PP3[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo3(output.children[i]);
        }
    }

    function copyOutTo3(
        ParameterPayload memory output
    ) private pure returns (PP3 memory result) {
        result._static = output._static;
        result.dynamic = output.dynamic;
        result.dynamic32 = output.dynamic32;

        result.children = new PP4[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo4(output.children[i]);
        }
    }

    function copyOutTo4(
        ParameterPayload memory output
    ) private pure returns (PP4 memory result) {
        result._static = output._static;
        result.dynamic = output.dynamic;
        result.dynamic32 = output.dynamic32;

        result.children = new PP5[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo5(output.children[i]);
        }
    }

    function copyOutTo5(
        ParameterPayload memory output
    ) private pure returns (PP5 memory result) {
        result._static = output._static;
        result.dynamic = output.dynamic;
        result.dynamic32 = output.dynamic32;
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
        PL5[] children;
    }

    struct PL5 {
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
        PP5[] children;
    }

    struct PP5 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
    }
}
