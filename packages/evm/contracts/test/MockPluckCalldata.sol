// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../PluckCalldata.sol";

contract MockPluckCalldata {
    function pluckDynamicParam(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes memory) {
        return PluckCalldata.pluckDynamicParam(data, index);
    }

    function pluckDynamic32Param(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes32[] memory) {
        return PluckCalldata.pluckDynamic32Param(data, index);
    }

    function pluckStaticParam(
        bytes memory data,
        uint256 index
    ) public pure returns (bytes32) {
        return PluckCalldata.pluckStaticParam(data, index);
    }

    function pluckTupleParam(
        bytes memory data,
        uint256 index,
        ParameterType[] memory tupleTypes
    ) public pure returns (PluckedParameter[] memory result) {
        return PluckCalldata.pluckTupleParam(data, index, tupleTypes);
    }
}
