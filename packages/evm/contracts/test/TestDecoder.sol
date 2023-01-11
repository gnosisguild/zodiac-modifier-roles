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
    uint256 a;
    bytes b;
    DynamicTuple c;
}

struct DynamicTupleWithArray {
    uint256 a;
    bytes b;
    StaticTuple[] c;
}

/*
[
  'function arrayDynamicTupleItems(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32)[])',
  'function arrayStaticTupleItems(tuple(uint256 a, address b)[])',
  'function dynamicTuple(tuple(bytes dynamic, uint256 _static, uint256[] dynamic32))',
  'function dynamicTupleWithNestedArray(tuple(uint256 a, bytes b, tuple(uint256 a, address b)[] c))',
  'function dynamicTupleWithNestedDynamicTuple(tuple(uint256 a, bytes b, tuple(bytes dynamic, uint256 _static, uint256[] dynamic32) c))',
  'function dynamicTupleWithNestedStaticTuple(tuple(uint256 a, bytes b, tuple(uint256 a, address b) c))'
]
*/

contract TestDecoder {
    function dynamicTuple(DynamicTuple memory) external {}

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
