// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../Roles.sol";
import "../../libraries/AllowanceLoader.sol";

/**
 * @title MockAllowanceLoader
 * @notice Test contract that exposes AllowanceLoader library functions
 * @dev Extends Roles to get access to allowances storage and setAllowance
 */
contract MockAllowanceLoader is Roles {
    constructor(
        address _owner,
        address _avatar,
        address _target
    ) Roles(_owner, _avatar, _target) {}

    function accrue(
        bytes32 allowanceKey,
        uint64 blockTimestamp
    ) external view returns (uint128 balance, uint64 timestamp) {
        return AllowanceLoader.accrue(allowanceKey, blockTimestamp);
    }
}
