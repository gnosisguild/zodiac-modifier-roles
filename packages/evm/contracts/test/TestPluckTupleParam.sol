// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

struct DynamicTuple1 {
    uint256 _static;
    bytes dynamic;
    uint256[] dynamic32;
}

contract TestPluckTupleParam {
    function dynamicTuple(DynamicTuple1 memory arg1) external {}
}
