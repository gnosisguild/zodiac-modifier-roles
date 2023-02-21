// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../Decoder.sol";

contract MockDecoder {
    function inspect(
        bytes calldata data,
        PL1[] calldata layout
    ) public pure returns (PP1[] memory) {
        return copyOut(Decoder.inspect(data, copyIn(layout)));
    }

    function pluck(
        bytes calldata data,
        uint256 offset,
        uint256 size
    ) public pure returns (bytes memory result) {
        return Decoder.pluck(data, offset, size);
    }

    function copyIn(
        PL1[] calldata input
    ) private pure returns (TypeTopology[] memory result) {
        result = new TypeTopology[](input.length);
        for (uint256 i; i < input.length; i++) {
            //result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            //result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL2[] calldata input
    ) private pure returns (TypeTopology[] memory result) {
        result = new TypeTopology[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            // result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            // result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL3[] calldata input
    ) private pure returns (TypeTopology[] memory result) {
        result = new TypeTopology[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            // result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            // result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL4[] calldata input
    ) private pure returns (TypeTopology[] memory result) {
        result = new TypeTopology[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            // result[i].isScoped = input[i].isScoped;
            result[i]._type = input[i]._type;
            // result[i].comp = input[i].comp;
            result[i].children = copyIn(input[i].children);
        }
    }

    function copyIn(
        PL5[] calldata input
    ) private pure returns (TypeTopology[] memory result) {
        result = new TypeTopology[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            result[i]._type = input[i]._type;
            result[i].children = new TypeTopology[](0);
        }
    }

    function copyOut(
        ParameterPayload[] memory output
    ) private pure returns (PP1[] memory result) {
        result = new PP1[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i].offset = output[i].location;
            result[i].size = output[i].size;
            result[i].raw = output[i].raw;
            result[i].children = copyOutTo2(output[i].children);
        }
    }

    function copyOutTo2(
        ParameterPayload[] memory output
    ) private pure returns (PP2[] memory result) {
        result = new PP2[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i].offset = output[i].location;
            result[i].size = output[i].size;
            result[i].raw = output[i].raw;
            result[i].children = copyOutTo3(output[i].children);
        }
    }

    function copyOutTo3(
        ParameterPayload[] memory output
    ) private pure returns (PP3[] memory result) {
        result = new PP3[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i].offset = output[i].location;
            result[i].size = output[i].size;
            result[i].raw = output[i].raw;
            result[i].children = copyOutTo4(output[i].children);
        }
    }

    function copyOutTo4(
        ParameterPayload[] memory output
    ) private pure returns (PP4[] memory result) {
        result = new PP4[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i].offset = output[i].location;
            result[i].size = output[i].size;
            result[i].raw = output[i].raw;
            result[i].children = copyOutTo5(output[i].children);
        }
    }

    function copyOutTo5(
        ParameterPayload[] memory output
    ) private pure returns (PP5[] memory result) {
        result = new PP5[](output.length);
        for (uint256 i = 0; i < output.length; i++) {
            result[i].offset = output[i].location;
            result[i].size = output[i].size;
            result[i].raw = output[i].raw;
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
        PL5[] children;
    }

    struct PL5 {
        bool isScoped;
        ParameterType _type;
        Comparison comp;
    }

    struct PP1 {
        uint256 offset;
        uint256 size;
        bytes raw;
        PP2[] children;
    }

    struct PP2 {
        uint256 offset;
        uint256 size;
        bytes raw;
        PP3[] children;
    }

    struct PP3 {
        uint256 offset;
        uint256 size;
        bytes raw;
        PP4[] children;
    }

    struct PP4 {
        uint256 offset;
        uint256 size;
        bytes raw;
        PP5[] children;
    }

    struct PP5 {
        uint256 offset;
        uint256 size;
        bytes raw;
    }
}
