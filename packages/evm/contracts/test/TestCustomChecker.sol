// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../adapters/Types.sol";

contract TestCustomChecker is ICustomCondition {
    function check(
        address,
        uint256,
        bytes calldata data,
        Enum.Operation operation,
        uint256 location,
        uint256 size,
        bytes12 extra
    ) public pure returns (bool success, bytes32 reason) {
        uint256 param = uint256(bytes32(data[location:location + size]));

        if (operation != Enum.Operation.Call) {
            return (false, bytes32(0));
        }

        if (param > 100) {
            return (true, 0);
        } else {
            return (false, bytes32(extra));
        }
    }
}
