// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../PluckCalldata.sol";

contract MockPluckCalldata {
    function pluckDynamicParam(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes memory) {
        return PluckCalldata.pluckDynamicParam(data, index);
    }

    function pluckDynamic32Param(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes32[] memory) {
        return PluckCalldata.pluckDynamic32Param(data, index);
    }

    function pluckStaticParam(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes32) {
        return PluckCalldata.pluckStaticParam(data, index);
    }

    function pluck(
        bytes memory data,
        PL1[] calldata layout
    ) public pure returns (PP1[] memory) {
        return copyOut(PluckCalldata.pluck(data, copyIn(layout)));
    }

    function copyIn(
        PL1[] calldata input
    ) private pure returns (ParameterLayout[] memory result) {
        result = new ParameterLayout[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].nested = copyIn(input[i].nested);
        }
    }

    function copyIn(
        PL2[] calldata input
    ) private pure returns (ParameterLayout[] memory result) {
        result = new ParameterLayout[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].nested = copyIn(input[i].nested);
        }
    }

    function copyIn(
        PL3[] calldata input
    ) private pure returns (ParameterLayout[] memory result) {
        result = new ParameterLayout[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            result[i].comp = input[i].comp;
            result[i].nested = copyIn(input[i].nested);
        }
    }

    function copyIn(
        PL4[] calldata input
    ) private pure returns (ParameterLayout[] memory result) {
        result = new ParameterLayout[](input.length);
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
            result[i].nested = copyOutTo2(output[i].nested);
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
            result[i].nested = copyOutTo3(output[i].nested);
        }
    }

    function copyOutTo2(
        ParameterPayload[][] memory output
    ) private pure returns (PP2[][] memory result) {
        result = new PP2[][](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i] = copyOutTo2(output[i]);
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
            result[i].nested = copyOutTo4(output[i].nested);
        }
    }

    function copyOutTo3(
        ParameterPayload[][] memory output
    ) private pure returns (PP3[][] memory result) {
        result = new PP3[][](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i] = copyOutTo3(output[i]);
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

    function copyOutTo4(
        ParameterPayload[][] memory output
    ) private pure returns (PP4[][] memory result) {
        result = new PP4[][](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i] = copyOutTo4(output[i]);
        }
    }

    struct PL1 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        PL2[] nested;
    }

    struct PL2 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        PL3[] nested;
    }

    struct PL3 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
        PL4[] nested;
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
        PP2[] nested;
    }

    struct PP2 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
        PP3[] nested;
    }

    struct PP3 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
        PP4[] nested;
    }

    struct PP4 {
        bytes32 _static;
        bytes dynamic;
        bytes32[] dynamic32;
    }
}
