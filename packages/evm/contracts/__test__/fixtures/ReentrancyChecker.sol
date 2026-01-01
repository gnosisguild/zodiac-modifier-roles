// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

import "../../Roles.sol";
import {IRolesError} from "../../types/RolesError.sol";

contract ReentrancyChecker {
    Roles public roles;
    bytes32 public roleKey;
    bool public attackCalled;
    bool public doNothingCalled;
    bool public caughtReentrancy;

    constructor(address _roles, bytes32 _roleKey) {
        roles = Roles(_roles);
        roleKey = _roleKey;
    }

    /// @dev Called by avatar during execution. Tries to reenter roles.
    function attack() external {
        attackCalled = true;
        // Attempt reentrant call back into roles - should fail with Reentrancy
        try
            roles.execTransactionWithRole(
                address(this),
                0,
                abi.encodeCall(this.doNothing, ()),
                Operation.Call,
                roleKey,
                false
            )
        {
            // If we get here, reentrancy was NOT blocked
            caughtReentrancy = false;
        } catch (bytes memory reason) {
            // Check if it's the Reentrancy error
            caughtReentrancy =
                bytes4(reason) == IRolesError.Reentrancy.selector;
        }
    }

    function doNothing() external {
        doNothingCalled = true;
    }
}
