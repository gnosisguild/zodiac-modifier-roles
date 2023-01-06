// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../PluckCalldata.sol";

contract MockPluckCalldata {
    function pluckDynamicValue(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes memory) {
        return PluckCalldata.pluckDynamicValue(data, index);
    }

    function pluckDynamic32Value(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes32[] memory) {
        return PluckCalldata.pluckDynamic32Value(data, index);
    }

    function pluckStaticValue(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes32) {
        return PluckCalldata.pluckStaticValue(data, index);
    }
}
