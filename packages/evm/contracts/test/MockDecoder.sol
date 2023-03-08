// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../Decoder.sol";

contract MockDecoder {
    function inspect(
        bytes calldata data,
        PL1 calldata layout
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
        PL1 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL2 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL3 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL4 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL5 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL6 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL7 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL8 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL9 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
        result.children = new TypeTopology[](input.children.length);
        for (uint256 i; i < input.children.length; i++) {
            result.children[i] = copyIn(input.children[i]);
        }
    }

    function copyIn(
        PL10 calldata input
    ) private pure returns (TypeTopology memory result) {
        result._type = input._type;
    }

    function copyOut(
        ParameterPayload memory output
    ) private pure returns (PP1 memory result) {
        result.offset = output.location;
        result.size = output.size;
        result.children = new PP2[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo2(output.children[i]);
        }
    }

    function copyOutTo2(
        ParameterPayload memory output
    ) private pure returns (PP2 memory result) {
        result.offset = output.location;
        result.size = output.size;
        result.children = new PP3[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo3(output.children[i]);
        }
    }

    function copyOutTo3(
        ParameterPayload memory output
    ) private pure returns (PP3 memory result) {
        result.offset = output.location;
        result.size = output.size;
        result.children = new PP4[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo4(output.children[i]);
        }
    }

    function copyOutTo4(
        ParameterPayload memory output
    ) private pure returns (PP4 memory result) {
        result.offset = output.location;
        result.size = output.size;
        result.children = new PP5[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo5(output.children[i]);
        }
    }

    function copyOutTo5(
        ParameterPayload memory output
    ) private pure returns (PP5 memory result) {
        result.offset = output.location;
        result.size = output.size;
        result.children = new PP6[](output.children.length);
        for (uint256 i = 0; i < output.children.length; i++) {
            result.children[i] = copyOutTo6(output.children[i]);
        }
    }

    function copyOutTo6(
        ParameterPayload memory output
    ) private pure returns (PP6 memory result) {
        result.offset = output.location;
        result.size = output.size;
        if (output.children.length > 0) {
            // throw new Error('Something bad happened');
        }
    }

    struct PL1 {
        ParameterType _type;
        PL2[] children;
    }

    struct PL2 {
        ParameterType _type;
        PL3[] children;
    }

    struct PL3 {
        ParameterType _type;
        PL4[] children;
    }

    struct PL4 {
        ParameterType _type;
        PL5[] children;
    }

    struct PL5 {
        ParameterType _type;
        PL6[] children;
    }

    struct PL6 {
        ParameterType _type;
        PL7[] children;
    }

    struct PL7 {
        ParameterType _type;
        PL8[] children;
    }

    struct PL8 {
        ParameterType _type;
        PL9[] children;
    }

    struct PL9 {
        ParameterType _type;
        PL10[] children;
    }

    struct PL10 {
        ParameterType _type;
    }

    struct PP1 {
        uint256 offset;
        uint256 size;
        PP2[] children;
    }

    struct PP2 {
        uint256 offset;
        uint256 size;
        PP3[] children;
    }

    struct PP3 {
        uint256 offset;
        uint256 size;
        PP4[] children;
    }

    struct PP4 {
        uint256 offset;
        uint256 size;
        PP5[] children;
    }

    struct PP5 {
        uint256 offset;
        uint256 size;
        PP6[] children;
    }

    struct PP6 {
        uint256 offset;
        uint256 size;
    }
}
