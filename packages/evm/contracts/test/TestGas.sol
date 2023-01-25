// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

struct Data {
    mapping(bytes32 => uint256) a;
    mapping(bytes32 => mapping(uint256 => uint256)) b;
}

contract TestGas {
    Data data;

    bytes32 constant key =
        0x0000000000000000000000000000000000000000000000000000000000003333;

    function insert() external {
        data.a[key] = 1;
        data.b[key][0] = 2;
    }

    function read1() external returns (uint256) {
        return data.a[key];
    }

    function read2() external returns (uint256) {
        return data.b[key][0];
    }
}
