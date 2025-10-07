// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.17 <0.9.0;

struct Call {
    address to;
    bytes data;
    uint256 value;
    bool skipRevert;
    bytes32 callbackHash;
}

contract Bundler3 {
    function multicall(Call[] calldata bundle) external payable {}
}
