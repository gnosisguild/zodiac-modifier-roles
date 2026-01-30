// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";

/// @title Membership Tests
/// @notice Verifies module authentication and access control: role assignment,
///         validity windows, usage accounting, and exhaustion behavior.
contract MembershipTest is BaseTest {
    uint64 constant maxUint64 = type(uint64).max;
    uint128 constant maxUint128 = type(uint128).max;

    bytes32 ROLE_KEY;
    address other;

    function setUp() public override {
        _deploySingletonFactory();

        owner = makeAddr("owner");
        member = makeAddr("member");
        other = makeAddr("other");

        // Warp to a reasonable timestamp to avoid underflow in time-based tests
        vm.warp(1000000);

        vm.startPrank(owner);

        avatar = new TestAvatar();
        testContract = new TestContract();
        roles = new Roles(owner, address(avatar), address(avatar));

        ROLE_KEY = keccak256("MEMBERSHIP_ROLE");

        vm.stopPrank();
    }

    // =========================================================================
    // AUTHENTICATION BASICS
    // =========================================================================

    function test_revertsWhenCallerIsNotEnabledModule() public {
        // other is NOT enabled as a module
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSignature("NotAuthorized(address)", other));
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_revertsNoMembershipWhenNoMembership() public {
        vm.startPrank(owner);
        roles.enableModule(member);
        roles.setDefaultRole(member, ROLE_KEY);
        vm.stopPrank();

        // member is enabled as module but has no membership for ROLE_KEY
        vm.prank(member);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_revertsNoMembershipAfterRevocation() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Can execute
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        vm.prank(owner);
        roles.revokeRole(member, ROLE_KEY);

        // No longer a member
        vm.prank(member);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_rejectsZeroRoleEvenIfStorageNonZero() public {
        bytes32 ZERO_ROLE = bytes32(0);

        vm.startPrank(owner);
        roles.grantRole(member, ZERO_ROLE, 0, 0, 0);
        roles.setDefaultRole(member, ZERO_ROLE);
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    // =========================================================================
    // VALIDITY WINDOW
    // =========================================================================

    function test_validity_revertsBeforeStartTimestamp() public {
        uint64 futureStart = uint64(block.timestamp + 3600);

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, futureStart, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(IRolesError.MembershipNotYetValid.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_validity_succeedsAtExactlyStartTimestamp() public {
        uint64 start = uint64(block.timestamp + 100);

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, start, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.warp(start);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_validity_succeedsWithinValidWindow() public {
        uint64 start = uint64(block.timestamp - 100);
        uint64 end = uint64(block.timestamp + 3600);

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, start, end, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_validity_succeedsAtExactlyEndTimestamp() public {
        uint64 end = uint64(block.timestamp + 100);

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, end, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.warp(end);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_validity_revertsAfterEndTimestamp() public {
        uint64 end = uint64(block.timestamp + 100);

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, end, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.warp(end + 1);

        vm.prank(member);
        vm.expectRevert(IRolesError.MembershipExpired.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    // =========================================================================
    // USAGE ACCOUNTING - Unlimited
    // =========================================================================

    function test_usage_unlimitedDoesNotDecrement() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Execute multiple times - all should succeed
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(member);
            roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
        }
    }

    function test_usage_unlimitedDoesNotEmitUpdateRole() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // We record logs and check that UpdateRole is NOT emitted
        vm.recordLogs();
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 updateRoleTopic = keccak256("UpdateRole(bytes32,address,uint64,uint64,uint128)");
        for (uint256 i = 0; i < logs.length; i++) {
            assertTrue(logs[i].topics[0] != updateRoleTopic, "UpdateRole should not be emitted");
        }
    }

    function test_usage_unlimitedDoesNotEmitRevokeRole() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.recordLogs();
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 revokeRoleTopic = keccak256("RevokeRole(bytes32,address)");
        for (uint256 i = 0; i < logs.length; i++) {
            assertTrue(logs[i].topics[0] != revokeRoleTopic, "RevokeRole should not be emitted");
        }
    }

    // =========================================================================
    // USAGE ACCOUNTING - Finite
    // =========================================================================

    function test_usage_finiteDecrementsUsesLeft() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 3);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.UpdateRole(ROLE_KEY, member, 0, maxUint64, 2);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_usage_finitePreservesStartEndTimestamps() public {
        uint64 start = uint64(block.timestamp - 100);
        uint64 end = uint64(block.timestamp + 10000);

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, start, end, 5);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.UpdateRole(ROLE_KEY, member, start, end, 4);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_usage_finiteDoesNotDecrementOnFailedInnerExecution() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 2);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        bytes memory revertingData = abi.encodeWithSignature("fnThatReverts()");

        // Execute failing call - should NOT emit UpdateRole (no decrement)
        vm.recordLogs();
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, revertingData, Operation.Call);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 updateRoleTopic = keccak256("UpdateRole(bytes32,address,uint64,uint64,uint128)");
        for (uint256 i = 0; i < logs.length; i++) {
            assertTrue(logs[i].topics[0] != updateRoleTopic, "UpdateRole should not be emitted on failed inner exec");
        }

        // First successful call should show 2 -> 1 (proving failed call didn't decrement)
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.UpdateRole(ROLE_KEY, member, 0, maxUint64, 1);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_usage_finiteEmitsUpdateRoleWithDecrementedUsesLeft() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 5);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // First decrement: 5 -> 4
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.UpdateRole(ROLE_KEY, member, 0, maxUint64, 4);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        // Second decrement: 4 -> 3
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.UpdateRole(ROLE_KEY, member, 0, maxUint64, 3);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    // =========================================================================
    // EXHAUSTION
    // =========================================================================

    function test_exhaustion_revokesMembershipAtZeroUses() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 1);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Use the one use
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        // Next should fail - membership revoked
        vm.prank(member);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_exhaustion_emitsRevokeRoleAtZeroUses() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 1);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.RevokeRole(ROLE_KEY, member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_exhaustion_revertsNoMembershipAfterExhaustion() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 2);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Use both uses
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        // Subsequent call should fail
        vm.prank(member);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }
}
