// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/ICustomCondition.sol";

contract TestCustomChecker is ICustomCondition {
    function check(
        address,
        uint256,
        bytes calldata data,
        Operation operation,
        uint256 location,
        uint256 size,
        bytes calldata extra,
        bytes32[] memory
    ) public pure returns (bool success, bytes32 reason) {
        uint256 param = uint256(bytes32(data[location:location + size]));

        if (operation != Operation.Call) {
            return (false, bytes32(0));
        }

        if (param > 100) {
            return (true, 0);
        } else {
            return (false, bytes32(extra));
        }
    }
}
