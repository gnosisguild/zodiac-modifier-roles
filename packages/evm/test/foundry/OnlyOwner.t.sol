// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";

/// @title OnlyOwner Tests
/// @notice Verifies that all admin functions are restricted to the owner,
///         except renounceRole which anyone can call for themselves.
contract OnlyOwnerTest is BaseTest {
    address internal nonOwner;

    function setUp() public override {
        super.setUp();
        nonOwner = makeAddr("nonOwner");
    }

    // =========================================================================
    // grantRole
    // =========================================================================

    function test_grantRole_ownerSucceeds() public {
        vm.prank(owner);
        roles.grantRole(nonOwner, roleKey, 0, 0, 0);
    }

    function test_grantRole_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.grantRole(nonOwner, roleKey, 0, 0, 0);
    }

    // =========================================================================
    // revokeRole
    // =========================================================================

    function test_revokeRole_ownerSucceeds() public {
        vm.prank(owner);
        roles.revokeRole(member, roleKey);
    }

    function test_revokeRole_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.revokeRole(member, roleKey);
    }

    // =========================================================================
    // assignRoles
    // =========================================================================

    function test_assignRoles_ownerSucceeds() public {
        bytes32[] memory keys = new bytes32[](1);
        keys[0] = roleKey;
        bool[] memory memberOf = new bool[](1);
        memberOf[0] = true;

        vm.prank(owner);
        roles.assignRoles(nonOwner, keys, memberOf);
    }

    function test_assignRoles_nonOwnerReverts() public {
        bytes32[] memory keys = new bytes32[](1);
        keys[0] = roleKey;
        bool[] memory memberOf = new bool[](1);
        memberOf[0] = true;

        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.assignRoles(nonOwner, keys, memberOf);
    }

    // =========================================================================
    // setDefaultRole
    // =========================================================================

    function test_setDefaultRole_ownerSucceeds() public {
        vm.prank(owner);
        roles.setDefaultRole(member, roleKey);
    }

    function test_setDefaultRole_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.setDefaultRole(member, roleKey);
    }

    // =========================================================================
    // allowTarget
    // =========================================================================

    function test_allowTarget_ownerSucceeds() public {
        vm.prank(owner);
        roles.allowTarget(roleKey, address(testContract), "", ExecutionOptions.None);
    }

    function test_allowTarget_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.allowTarget(roleKey, address(testContract), "", ExecutionOptions.None);
    }

    // =========================================================================
    // scopeTarget
    // =========================================================================

    function test_scopeTarget_ownerSucceeds() public {
        vm.prank(owner);
        roles.scopeTarget(roleKey, address(testContract));
    }

    function test_scopeTarget_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.scopeTarget(roleKey, address(testContract));
    }

    // =========================================================================
    // revokeTarget
    // =========================================================================

    function test_revokeTarget_ownerSucceeds() public {
        vm.prank(owner);
        roles.revokeTarget(roleKey, address(testContract));
    }

    function test_revokeTarget_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.revokeTarget(roleKey, address(testContract));
    }

    // =========================================================================
    // allowFunction
    // =========================================================================

    function test_allowFunction_ownerSucceeds() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        vm.prank(owner);
        roles.allowFunction(roleKey, address(testContract), selector, "", ExecutionOptions.None);
    }

    function test_allowFunction_nonOwnerReverts() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.allowFunction(roleKey, address(testContract), selector, "", ExecutionOptions.None);
    }

    // =========================================================================
    // revokeFunction
    // =========================================================================

    function test_revokeFunction_ownerSucceeds() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        vm.prank(owner);
        roles.revokeFunction(roleKey, address(testContract), selector);
    }

    function test_revokeFunction_nonOwnerReverts() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.revokeFunction(roleKey, address(testContract), selector);
    }

    // =========================================================================
    // setAllowance
    // =========================================================================

    function test_setAllowance_ownerSucceeds() public {
        bytes32 allowanceKey = keccak256("ALLOWANCE");
        vm.prank(owner);
        roles.setAllowance(allowanceKey, 1000, 0, 0, 0, 0);
    }

    function test_setAllowance_nonOwnerReverts() public {
        bytes32 allowanceKey = keccak256("ALLOWANCE");
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.setAllowance(allowanceKey, 1000, 0, 0, 0, 0);
    }

    // =========================================================================
    // updateAllowance
    // =========================================================================

    function test_updateAllowance_ownerSucceeds() public {
        bytes32 allowanceKey = keccak256("ALLOWANCE");
        vm.startPrank(owner);
        roles.setAllowance(allowanceKey, 1000, 0, 0, 0, 0);
        roles.updateAllowance(allowanceKey, 0, 100, 3600);
        vm.stopPrank();
    }

    function test_updateAllowance_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.updateAllowance(keccak256("ALLOWANCE"), 0, 100, 3600);
    }

    // =========================================================================
    // setTransactionUnwrapper
    // =========================================================================

    function test_setTransactionUnwrapper_ownerSucceeds() public {
        vm.prank(owner);
        roles.setTransactionUnwrapper(address(testContract), bytes4(keccak256("foo()")), address(1));
    }

    function test_setTransactionUnwrapper_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.setTransactionUnwrapper(address(testContract), bytes4(keccak256("foo()")), address(1));
    }

    // =========================================================================
    // enableModule
    // =========================================================================

    function test_enableModule_ownerSucceeds() public {
        vm.prank(owner);
        roles.enableModule(nonOwner);
    }

    function test_enableModule_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.enableModule(nonOwner);
    }

    // =========================================================================
    // disableModule
    // =========================================================================

    function test_disableModule_ownerSucceeds() public {
        // member is already enabled as a module from base setUp
        // Need to find the prev pointer for the linked list
        // The sentinel is address(1)
        vm.prank(owner);
        roles.disableModule(address(1), member);
    }

    function test_disableModule_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.disableModule(address(1), member);
    }

    // =========================================================================
    // transferOwnership
    // =========================================================================

    function test_transferOwnership_ownerSucceeds() public {
        vm.prank(owner);
        roles.transferOwnership(nonOwner);
    }

    function test_transferOwnership_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.transferOwnership(nonOwner);
    }

    // =========================================================================
    // renounceOwnership
    // =========================================================================

    function test_renounceOwnership_ownerSucceeds() public {
        vm.prank(owner);
        roles.renounceOwnership();
    }

    function test_renounceOwnership_nonOwnerReverts() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        roles.renounceOwnership();
    }

    // =========================================================================
    // renounceRole - NOT restricted
    // =========================================================================

    function test_renounceRole_anyoneCanSelfRevoke() public {
        // Grant role to nonOwner first
        vm.prank(owner);
        roles.grantRole(nonOwner, roleKey, 0, 0, 0);

        // nonOwner can renounce their own role
        vm.prank(nonOwner);
        roles.renounceRole(roleKey);
    }
}
