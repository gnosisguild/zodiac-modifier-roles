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
        bytes calldata,
        bytes32[] memory
    ) public pure returns (bool success) {
        uint256 param = uint256(bytes32(data[location:location + size]));

        if (operation != Operation.Call) {
            return false;
        }

        if (param > 100) {
            return true;
        } else {
            return false;
        }
    }
}

contract TestCustomCheckerNoInterface {
    function dummy() external pure returns (uint256) {
        return 42;
    }
}

contract TestCustomCheckerReverting is ICustomCondition {
    function check(
        address,
        uint256,
        bytes calldata,
        Operation,
        uint256,
        uint256,
        bytes calldata,
        bytes32[] memory
    ) public pure returns (bool) {
        revert("CustomChecker: intentional revert");
    }
}

contract TestCustomCheckerWrongReturn {
    function check(
        address,
        uint256,
        bytes calldata,
        uint8,
        uint256,
        uint256,
        bytes calldata,
        bytes32[] memory
    ) public pure returns (uint256, uint256) {
        return (999, 0);
    }
}
