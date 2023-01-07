// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

struct DynamicTuple {
    uint256 _static;
    bytes dynamic;
    uint256[] dynamic32;
}

struct StaticTuple {
    uint256 a;
    bytes2 b;
    address c;
}

contract TestPluckTupleParam {
    function dynamicTuple(DynamicTuple memory) external {}

    function dynamicTupleArray(DynamicTuple[] memory) external {}

    function staticTupleArray(StaticTuple[] memory) external {}
}
