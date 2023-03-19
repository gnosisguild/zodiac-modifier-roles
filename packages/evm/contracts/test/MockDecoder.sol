// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Decoder.sol";

contract MockDecoder {
    function inspect(
        bytes calldata data,
        IN1 calldata layout
    ) public pure returns (PP1 memory) {
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
        IN1 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN2 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN3 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN4 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN5 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN6 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN7 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN8 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN9 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
        result.children = new Condition[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        IN10 calldata input
    ) private pure returns (Condition memory result) {
        result.paramType = input.paramType;
        result.operator = input.operator;
    }

    function copyOut(
        ParameterPayload memory output
    ) private pure returns (PP1 memory result) {
        result.location = output.location;
        result.size = output.size;
        result.children = new PP2[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo2(output.children[i]);
        }
    }

    function copyOutTo2(
        ParameterPayload memory output
    ) private pure returns (PP2 memory result) {
        result.location = output.location;
        result.size = output.size;
        result.children = new PP3[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo3(output.children[i]);
        }
    }

    function copyOutTo3(
        ParameterPayload memory output
    ) private pure returns (PP3 memory result) {
        result.location = output.location;
        result.size = output.size;
        result.children = new PP4[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo4(output.children[i]);
        }
    }

    function copyOutTo4(
        ParameterPayload memory output
    ) private pure returns (PP4 memory result) {
        result.location = output.location;
        result.size = output.size;
        result.children = new PP5[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo5(output.children[i]);
        }
    }

    function copyOutTo5(
        ParameterPayload memory output
    ) private pure returns (PP5 memory result) {
        result.location = output.location;
        result.size = output.size;
        result.children = new PP6[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo6(output.children[i]);
        }
    }

    function copyOutTo6(
        ParameterPayload memory output
    ) private pure returns (PP6 memory result) {
        result.location = output.location;
        result.size = output.size;
        if (output.children.length > 0) {
            revert("MockDecoder needs more levels of recursion");
        }
    }

    struct IN1 {
        ParameterType paramType;
        Operator operator;
        IN2[] children;
    }

    struct IN2 {
        ParameterType paramType;
        Operator operator;
        IN3[] children;
    }

    struct IN3 {
        ParameterType paramType;
        Operator operator;
        IN4[] children;
    }

    struct IN4 {
        ParameterType paramType;
        Operator operator;
        IN5[] children;
    }

    struct IN5 {
        ParameterType paramType;
        Operator operator;
        IN6[] children;
    }

    struct IN6 {
        ParameterType paramType;
        Operator operator;
        IN7[] children;
    }

    struct IN7 {
        ParameterType paramType;
        Operator operator;
        IN8[] children;
    }

    struct IN8 {
        ParameterType paramType;
        Operator operator;
        IN9[] children;
    }

    struct IN9 {
        ParameterType paramType;
        Operator operator;
        IN10[] children;
    }

    struct IN10 {
        ParameterType paramType;
        Operator operator;
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
