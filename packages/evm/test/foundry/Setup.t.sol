// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";

/// @title Setup Tests - Configuration API
/// @notice Verifies the module's configuration interface: role management,
///         permission management, allowance configuration, and adapter management.
contract SetupTest is BaseTest {
    uint64 constant maxUint64 = type(uint64).max;
    uint128 constant maxUint128 = type(uint128).max;

    bytes32 ROLE_KEY;
    bytes32 ROLE_KEY_2;

    function setUp() public override {
        // Minimal setup: deploy avatar, roles, testContract without pre-granting role
        _deploySingletonFactory();

        owner = makeAddr("owner");
        member = makeAddr("member");

        vm.startPrank(owner);

        avatar = new TestAvatar();
        testContract = new TestContract();
        roles = new Roles(owner, address(avatar), address(avatar));

        ROLE_KEY = keccak256("TEST_ROLE");
        ROLE_KEY_2 = keccak256("TEST_ROLE_2");

        vm.stopPrank();
    }

    // =========================================================================
    // ROLE MEMBERSHIP - grantRole
    // =========================================================================

    function test_grantRole_grantsRoleToModule() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Member can now execute - proves role was granted
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_grantRole_automaticallyEnablesModule() public {
        assertFalse(roles.isModuleEnabled(member));

        vm.prank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);

        assertTrue(roles.isModuleEnabled(member));
    }

    function test_grantRole_emitsGrantRoleEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 100, 200, 5);
        roles.grantRole(member, ROLE_KEY, 100, 200, 5);
    }

    function test_grantRole_setsStartTimestamp() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 1000, maxUint64, maxUint128);
        roles.grantRole(member, ROLE_KEY, 1000, 0, 0);
    }

    function test_grantRole_defaultsToImmediatelyValid() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 0, maxUint64, maxUint128);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
    }

    function test_grantRole_setsEndTimestamp() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 0, 9999, maxUint128);
        roles.grantRole(member, ROLE_KEY, 0, 9999, 0);
    }

    function test_grantRole_defaultsToNeverExpires() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 0, maxUint64, maxUint128);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
    }

    function test_grantRole_setsFiniteUsesLeft() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 0, maxUint64, 10);
        roles.grantRole(member, ROLE_KEY, 0, 0, 10);
    }

    function test_grantRole_defaultsToUnlimitedUses() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 0, maxUint64, maxUint128);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
    }

    function test_grantRole_overwritesExistingMembership() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 100, 200, 5);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY, member, 300, 400, 10);
        roles.grantRole(member, ROLE_KEY, 300, 400, 10);
        vm.stopPrank();
    }

    // =========================================================================
    // ROLE MEMBERSHIP - revokeRole
    // =========================================================================

    function test_revokeRole_removesMembership() public {
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

        // Now cannot execute
        vm.prank(member);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_revokeRole_emitsRevokeRoleEvent() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.RevokeRole(ROLE_KEY, member);
        roles.revokeRole(member, ROLE_KEY);
        vm.stopPrank();
    }

    function test_revokeRole_doesNotDisableModule() public {
        assertFalse(roles.isModuleEnabled(member));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.grantRole(member, ROLE_KEY_2, 0, 0, 0);
        roles.revokeRole(member, ROLE_KEY);
        vm.stopPrank();

        assertTrue(roles.isModuleEnabled(member));
    }

    function test_revokeRole_succeedsOnNonExistent() public {
        vm.prank(owner);
        roles.revokeRole(member, ROLE_KEY);
        // No revert
    }

    // =========================================================================
    // ROLE MEMBERSHIP - renounceRole
    // =========================================================================

    function test_renounceRole_memberSelfRevokes() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Can execute
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        vm.prank(member);
        roles.renounceRole(ROLE_KEY);

        // Now cannot execute
        vm.prank(member);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_renounceRole_emitsRevokeRoleEvent() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        vm.stopPrank();

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.RevokeRole(ROLE_KEY, member);
        roles.renounceRole(ROLE_KEY);
    }

    // =========================================================================
    // ROLE MEMBERSHIP - assignRoles
    // =========================================================================

    function test_assignRoles_batchGrantsRoles() public {
        bytes32[] memory keys = new bytes32[](2);
        keys[0] = ROLE_KEY;
        keys[1] = ROLE_KEY_2;
        bool[] memory memberOf = new bool[](2);
        memberOf[0] = true;
        memberOf[1] = true;

        vm.prank(owner);
        roles.assignRoles(member, keys, memberOf);

        assertTrue(roles.isModuleEnabled(member));
    }

    function test_assignRoles_batchRevokesRoles() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.grantRole(member, ROLE_KEY_2, 0, 0, 0);

        bytes32[] memory keys = new bytes32[](2);
        keys[0] = ROLE_KEY;
        keys[1] = ROLE_KEY_2;
        bool[] memory memberOf = new bool[](2);
        memberOf[0] = false;
        memberOf[1] = false;

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.RevokeRole(ROLE_KEY, member);
        roles.assignRoles(member, keys, memberOf);
        vm.stopPrank();
    }

    function test_assignRoles_handlesMixedGrantAndRevoke() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);

        bytes32[] memory keys = new bytes32[](2);
        keys[0] = ROLE_KEY;
        keys[1] = ROLE_KEY_2;
        bool[] memory memberOf = new bool[](2);
        memberOf[0] = false;
        memberOf[1] = true;

        // We expect both events
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.RevokeRole(ROLE_KEY, member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.GrantRole(ROLE_KEY_2, member, 0, maxUint64, maxUint128);
        roles.assignRoles(member, keys, memberOf);
        vm.stopPrank();
    }

    // =========================================================================
    // setDefaultRole
    // =========================================================================

    function test_setDefaultRole_setsDefault() public {
        vm.prank(owner);
        roles.setDefaultRole(member, ROLE_KEY);

        assertEq(roles.defaultRoles(member), ROLE_KEY);
    }

    function test_setDefaultRole_emitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.SetDefaultRole(member, ROLE_KEY);
        roles.setDefaultRole(member, ROLE_KEY);
    }

    function test_setDefaultRole_allowsZeroHash() public {
        vm.startPrank(owner);
        roles.setDefaultRole(member, ROLE_KEY);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.SetDefaultRole(member, bytes32(0));
        roles.setDefaultRole(member, bytes32(0));
        vm.stopPrank();

        assertEq(roles.defaultRoles(member), bytes32(0));
    }

    function test_setDefaultRole_overwritesExisting() public {
        vm.startPrank(owner);
        roles.setDefaultRole(member, ROLE_KEY);
        assertEq(roles.defaultRoles(member), ROLE_KEY);

        roles.setDefaultRole(member, ROLE_KEY_2);
        assertEq(roles.defaultRoles(member), ROLE_KEY_2);
        vm.stopPrank();
    }

    // =========================================================================
    // TARGET PERMISSIONS - allowTarget
    // =========================================================================

    function test_allowTarget_setsClearance() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        vm.stopPrank();

        // Before allowTarget, should revert
        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.TargetAddressNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        vm.prank(owner);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);

        // After allowTarget, should succeed
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_allowTarget_validatesConditionTreeIntegrity() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 5, // Invalid - root must have parent 0
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(IRolesError.UnsuitableRootNode.selector);
        roles.packConditions(conditions);
    }

    function test_allowTarget_emitsAllowTargetEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.AllowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
    }

    function test_allowTarget_overwritesExistingPermission() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);

        // Allow target with no conditions
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Any param value works
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 99),
            Operation.Call
        );

        // Overwrite with condition: param must equal 42
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(42))
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowTarget(ROLE_KEY, address(testContract), packed, ExecutionOptions.None);
        vm.stopPrank();

        // Now 99 should fail
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 99),
            Operation.Call
        );

        // But 42 should pass
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );
    }

    // =========================================================================
    // TARGET PERMISSIONS - scopeTarget
    // =========================================================================

    function test_scopeTarget_setsFunctionClearance() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        vm.stopPrank();

        // Without allowFunction, calls should fail
        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.FunctionNotAllowed.selector, address(testContract), bytes4(keccak256("doNothing()"))));
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_scopeTarget_emitsScopeTargetEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.ScopeTarget(ROLE_KEY, address(testContract));
        roles.scopeTarget(ROLE_KEY, address(testContract));
    }

    // =========================================================================
    // TARGET PERMISSIONS - revokeTarget
    // =========================================================================

    function test_revokeTarget_setsClearanceToNone() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Verify target is allowed
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        vm.prank(owner);
        roles.revokeTarget(ROLE_KEY, address(testContract));

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.TargetAddressNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_revokeTarget_emitsRevokeTargetEvent() public {
        vm.startPrank(owner);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.RevokeTarget(ROLE_KEY, address(testContract));
        roles.revokeTarget(ROLE_KEY, address(testContract));
        vm.stopPrank();
    }

    function test_revokeTarget_doesNotClearFunctionScopeConfig() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);

        // Revoke target
        roles.revokeTarget(ROLE_KEY, address(testContract));
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.TargetAddressNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // Re-scope - function should still be allowed (scopeConfig preserved)
        vm.prank(owner);
        roles.scopeTarget(ROLE_KEY, address(testContract));

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_revokeTarget_succeedsOnNonAllowed() public {
        vm.prank(owner);
        roles.revokeTarget(ROLE_KEY, address(testContract));
        // No revert
    }

    // =========================================================================
    // FUNCTION PERMISSIONS - allowFunction
    // =========================================================================

    function test_allowFunction_storesEmptyConditionsAsPassNode() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);
        vm.stopPrank();

        // Should be able to call the function
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_allowFunction_storesAndEnforcesConditions() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(42))
        });

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        // Call with 42 - should succeed
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );

        // Call with 99 - should fail
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 99),
            Operation.Call
        );
    }

    function test_allowFunction_validatesConditionTreeIntegrity() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 5, // Invalid
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(IRolesError.UnsuitableRootNode.selector);
        roles.packConditions(conditions);
    }

    function test_allowFunction_emitsAllowFunctionEvent() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.AllowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);
    }

    function test_allowFunction_overwritesExistingPermission() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));

        // Allow with condition: param must equal 1
        ConditionFlat[] memory conditionsEq1 = new ConditionFlat[](2);
        conditionsEq1[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditionsEq1[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(1))
        });
        bytes memory packed1 = roles.packConditions(conditionsEq1);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed1, ExecutionOptions.None);
        vm.stopPrank();

        // Call with 2 should fail
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 2),
            Operation.Call
        );

        // Overwrite: param must equal 2
        ConditionFlat[] memory conditionsEq2 = new ConditionFlat[](2);
        conditionsEq2[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditionsEq2[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(2))
        });

        vm.startPrank(owner);
        bytes memory packed2 = roles.packConditions(conditionsEq2);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed2, ExecutionOptions.None);
        vm.stopPrank();

        // Call with 2 should now pass
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 2),
            Operation.Call
        );
    }

    // =========================================================================
    // FUNCTION PERMISSIONS - revokeFunction
    // =========================================================================

    function test_revokeFunction_deletesScopeConfig() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);
        vm.stopPrank();

        // Can call
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        vm.prank(owner);
        roles.revokeFunction(ROLE_KEY, address(testContract), selector);

        // No longer allowed
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_revokeFunction_emitsRevokeFunctionEvent() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.RevokeFunction(ROLE_KEY, address(testContract), selector);
        roles.revokeFunction(ROLE_KEY, address(testContract), selector);
        vm.stopPrank();
    }

    function test_revokeFunction_doesNotAffectOtherFunctions() public {
        bytes4 selector1 = bytes4(keccak256("doNothing()"));
        bytes4 selector2 = bytes4(keccak256("doEvenLess()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector1, "", ExecutionOptions.None);
        roles.allowFunction(ROLE_KEY, address(testContract), selector2, "", ExecutionOptions.None);

        // Revoke selector1
        roles.revokeFunction(ROLE_KEY, address(testContract), selector1);
        vm.stopPrank();

        // selector1 should be revoked
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // selector2 should still be allowed
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doEvenLess()"),
            Operation.Call
        );
    }

    // =========================================================================
    // ALLOWANCES - setAllowance
    // =========================================================================

    function test_setAllowance_setsBalance() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (uint128 refill, uint128 maxRefill, uint64 period, uint128 balance, uint64 timestamp) =
            roles.allowances(ALLOWANCE_KEY);
        assertEq(balance, 500);
    }

    function test_setAllowance_setsRefill() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (uint128 refill,,,, ) = roles.allowances(ALLOWANCE_KEY);
        assertEq(refill, 100);
    }

    function test_setAllowance_setsPeriod() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,, uint64 period,, ) = roles.allowances(ALLOWANCE_KEY);
        assertEq(period, 3600);
    }

    function test_setAllowance_emitsSetAllowanceEvent() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.prank(owner);
        vm.expectEmit(true, true, true, false, address(roles));
        emit IRolesEvent.SetAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
    }

    function test_setAllowance_defaultsMaxRefillToMaxUint128() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 0, 100, 3600, 0);

        (, uint128 maxRefill,,, ) = roles.allowances(ALLOWANCE_KEY);
        assertEq(maxRefill, maxUint128);
    }

    function test_setAllowance_defaultsTimestampToBlockTimestamp() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,,,, uint64 timestamp) = roles.allowances(ALLOWANCE_KEY);
        assertEq(timestamp, uint64(block.timestamp));
    }

    function test_setAllowance_overwritesAllFields() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.setAllowance(ALLOWANCE_KEY, 999, 2000, 200, 7200, 0);
        vm.stopPrank();

        (uint128 refill, uint128 maxRefill, uint64 period, uint128 balance,) =
            roles.allowances(ALLOWANCE_KEY);
        assertEq(balance, 999);
        assertEq(maxRefill, 2000);
        assertEq(refill, 200);
        assertEq(period, 7200);
    }

    // =========================================================================
    // ALLOWANCES - updateAllowance
    // =========================================================================

    function test_updateAllowance_updatesRefillParametersOnly() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);
        vm.stopPrank();

        (uint128 refill, uint128 maxRefill, uint64 period,,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(maxRefill, 2000);
        assertEq(refill, 200);
        assertEq(period, 7200);
    }

    function test_updateAllowance_preservesExistingBalance() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);
        vm.stopPrank();

        (,,, uint128 balance,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(balance, 500);
    }

    function test_updateAllowance_preservesExistingTimestamp() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        vm.stopPrank();

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 1000);

        vm.prank(owner);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

        (,,,, uint64 afterTimestamp) = roles.allowances(ALLOWANCE_KEY);
        assertEq(afterTimestamp, initialTimestamp);
    }

    function test_updateAllowance_emitsSetAllowanceEvent() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        vm.expectEmit(false, false, false, false, address(roles));
        emit IRolesEvent.SetAllowance(ALLOWANCE_KEY, 500, 2000, 200, 7200, 0);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);
        vm.stopPrank();
    }

    // =========================================================================
    // ADAPTERS - setTransactionUnwrapper
    // =========================================================================

    function test_setTransactionUnwrapper_registersUnwrapper() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        address unwrapper = makeAddr("unwrapper");

        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.SetUnwrapAdapter(address(testContract), selector, unwrapper);
        roles.setTransactionUnwrapper(address(testContract), selector, unwrapper);
    }

    function test_setTransactionUnwrapper_emitsSetUnwrapAdapterEvent() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        address unwrapper = makeAddr("unwrapper");

        vm.prank(owner);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.SetUnwrapAdapter(address(testContract), selector, unwrapper);
        roles.setTransactionUnwrapper(address(testContract), selector, unwrapper);
    }

    function test_setTransactionUnwrapper_canUpdate() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        address unwrapper1 = makeAddr("unwrapper1");
        address unwrapper2 = makeAddr("unwrapper2");

        vm.startPrank(owner);
        roles.setTransactionUnwrapper(address(testContract), selector, unwrapper1);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.SetUnwrapAdapter(address(testContract), selector, unwrapper2);
        roles.setTransactionUnwrapper(address(testContract), selector, unwrapper2);
        vm.stopPrank();
    }

    function test_setTransactionUnwrapper_canRemoveBySettingZeroAddress() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));
        address unwrapper = makeAddr("unwrapper");

        vm.startPrank(owner);
        roles.setTransactionUnwrapper(address(testContract), selector, unwrapper);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.SetUnwrapAdapter(address(testContract), selector, address(0));
        roles.setTransactionUnwrapper(address(testContract), selector, address(0));
        vm.stopPrank();
    }

    // =========================================================================
    // ISOLATION
    // =========================================================================

    function test_isolation_allowingOneTargetDoesNotAllowAnother() public {
        TestContract testContract2 = new TestContract();

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // testContract is allowed
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);

        // testContract2 is NOT allowed
        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.TargetAddressNotAllowed.selector, address(testContract2)));
        roles.execTransactionFromModule(payable(address(testContract2)), 0, "", Operation.Call);
    }

    function test_isolation_allowingOneFunctionDoesNotAllowOthers() public {
        bytes4 selector1 = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector1, "", ExecutionOptions.None);
        vm.stopPrank();

        // selector1 is allowed
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(selector1);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // fnThatReverts selector is NOT allowed
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("fnThatReverts()"),
            Operation.Call
        );
    }

    function test_isolation_functionOnOneTargetDoesNotAllowSameOnAnother() public {
        TestContract testContract2 = new TestContract();
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.scopeTarget(ROLE_KEY, address(testContract2));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);
        vm.stopPrank();

        // Function on testContract is allowed
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // Same function on testContract2 is NOT allowed
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract2)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_isolation_multipleRolesDifferentPermissions() public {
        bytes4 selector1 = bytes4(keccak256("doNothing()"));
        bytes4 selector2 = bytes4(keccak256("doEvenLess()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.grantRole(member, ROLE_KEY_2, 0, 0, 0);

        // ROLE_KEY: only selector1 allowed
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector1, "", ExecutionOptions.None);

        // ROLE_KEY_2: only selector2 allowed
        roles.scopeTarget(ROLE_KEY_2, address(testContract));
        roles.allowFunction(ROLE_KEY_2, address(testContract), selector2, "", ExecutionOptions.None);

        // With ROLE_KEY as default
        roles.setDefaultRole(member, ROLE_KEY);
        vm.stopPrank();

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(selector1);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doEvenLess()"),
            Operation.Call
        );

        // Switch to ROLE_KEY_2
        vm.prank(owner);
        roles.setDefaultRole(member, ROLE_KEY_2);

        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doEvenLess()"),
            Operation.Call
        );
    }
}
