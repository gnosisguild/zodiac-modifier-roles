// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

struct StaticTuple {
    uint256 a;
    address b;
}

struct DynamicTuple {
    bytes dynamic;
    uint256 _static;
    uint256[] dynamic32;
}

struct DynamicTupleWithStaticTuple {
    uint256 a;
    bytes b;
    StaticTuple c;
}

struct DynamicTupleWithDynamicTuple {
    bytes a;
    StaticTuple b;
    uint256 c;
    DynamicTuple d;
}

struct DynamicTupleWithArray {
    uint256 a;
    bytes b;
    StaticTuple[] c;
}

contract TestEncoder {
    function staticFn(bytes4) external {}

    function staticDynamicDynamic32(
        address,
        bytes calldata,
        uint32[] memory
    ) external {}

    function dynamicStaticDynamic32(
        bytes calldata,
        bool,
        bytes2[] memory
    ) external {}

    function dynamic32DynamicStatic(
        bytes2[] calldata,
        string memory,
        uint32
    ) external {}

    function dynamicTuple(DynamicTuple memory) external {}

    function staticTuple(StaticTuple memory, uint256) external {}

    function dynamicTupleWithNestedStaticTuple(
        DynamicTupleWithStaticTuple memory
    ) external {}

    function dynamicTupleWithNestedDynamicTuple(
        DynamicTupleWithDynamicTuple memory
    ) external {}

    function dynamicTupleWithNestedArray(
        DynamicTupleWithArray memory
    ) external {}

    function arrayStaticTupleItems(StaticTuple[] memory) external {}

    function arrayDynamicTupleItems(DynamicTuple[] memory) external {}
}
