// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

struct Role {
    mapping(bytes => uint256) a;
    mapping(bytes32 => uint256) b;
}

contract TestGas {
    Role role;

    function insertBytes(bytes memory key, uint256 value) external {
        role.a[key] = value;
    }

    function insertBytes32(bytes32 key, uint256 value) external {
        role.b[key] = value;
    }

    function insertHashAndBytes32(bytes memory key, uint256 value) external {
        role.b[keccak256(key)] = value;
    }
}
