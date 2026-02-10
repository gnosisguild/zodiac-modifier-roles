// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";

/// @title Execution Mechanics Tests
/// @notice Verifies transaction execution lifecycle: return values, error handling,
///         and state persistence across all execution entry points.
contract ExecutionTest is BaseTest {
    bytes32 ROLE_KEY;
    bytes32 ALLOWANCE_KEY;
    address invoker;

    function setUp() public override {
        _deploySingletonFactory();

        owner = makeAddr("owner");
        invoker = makeAddr("invoker");
        member = invoker; // reuse member slot for the invoker

        vm.startPrank(owner);

        avatar = new TestAvatar();
        testContract = new TestContract();
        roles = new Roles(owner, address(avatar), address(avatar));

        ROLE_KEY = keccak256("TEST_ROLE");
        ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        // Enable invoker as module
        roles.enableModule(invoker);

        // Grant role
        roles.grantRole(invoker, ROLE_KEY, 0, 0, 0);

        // Set default role
        roles.setDefaultRole(invoker, ROLE_KEY);

        // Set initial allowance: 1000
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        // Scope target
        roles.scopeTarget(ROLE_KEY, address(testContract));

        // Allow fnThatMaybeReverts(uint256, bool) with WithinAllowance on first param
        bytes4 selector = bytes4(keccak256("fnThatMaybeReverts(uint256,bool)"));
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);

        vm.stopPrank();
    }

    // =========================================================================
    // execTransactionFromModule
    // =========================================================================

    function test_execFromModule_returnsSuccessAndPersistsConsumption() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, false);

        // Static call to check return value
        vm.prank(invoker);
        bool success = roles.execTransactionFromModule(
            payable(address(testContract)), 0, calldata_, Operation.Call
        );
        assertTrue(success);

        // Verify persistence: 1000 - 100 = 900
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_execFromModule_returnsFalseAndNoPersistenceOnInnerFailure() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        // Execute the failing call
        vm.prank(invoker);
        bool success = roles.execTransactionFromModule(
            payable(address(testContract)), 0, calldata_, Operation.Call
        );
        assertFalse(success);

        // Verify rollback: 1000 (unchanged)
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    // =========================================================================
    // execTransactionFromModuleReturnData
    // =========================================================================

    function test_execFromModuleReturnData_returnsSuccessAndPersists() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, false);

        vm.prank(invoker);
        (bool success, ) = roles.execTransactionFromModuleReturnData(
            payable(address(testContract)), 0, calldata_, Operation.Call
        );
        assertTrue(success);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_execFromModuleReturnData_returnsFalseAndNoPersistenceOnFailure() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        vm.prank(invoker);
        (bool success, ) = roles.execTransactionFromModuleReturnData(
            payable(address(testContract)), 0, calldata_, Operation.Call
        );
        assertFalse(success);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    // =========================================================================
    // execTransactionWithRole
    // =========================================================================

    function test_execWithRole_succeedsAndPersistsWithCorrectRole() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, false);

        vm.prank(invoker);
        bool success = roles.execTransactionWithRole(
            payable(address(testContract)), 0, calldata_, Operation.Call, ROLE_KEY, false
        );
        assertTrue(success);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_execWithRole_revertsWithUnassignedRole() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, false);
        bytes32 BAD_ROLE = keccak256("BAD_ROLE");

        vm.prank(invoker);
        vm.expectRevert(IRolesError.NoMembership.selector);
        roles.execTransactionWithRole(
            payable(address(testContract)), 0, calldata_, Operation.Call, BAD_ROLE, false
        );
    }

    function test_execWithRole_returnsFalseNoPersistenceWhenInnerFailAndShouldRevertFalse() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        vm.prank(invoker);
        bool success = roles.execTransactionWithRole(
            payable(address(testContract)), 0, calldata_, Operation.Call, ROLE_KEY, false
        );
        assertFalse(success);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    function test_execWithRole_revertsNoPersistenceWhenInnerFailAndShouldRevertTrue() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        vm.prank(invoker);
        vm.expectRevert(IRolesError.ModuleTransactionFailed.selector);
        roles.execTransactionWithRole(
            payable(address(testContract)), 0, calldata_, Operation.Call, ROLE_KEY, true
        );

        // State should be rolled back
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    // =========================================================================
    // execTransactionWithRoleReturnData
    // =========================================================================

    function test_execWithRoleReturnData_returnsDataAndPersistsOnSuccess() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, false);

        vm.prank(invoker);
        (bool success, ) = roles.execTransactionWithRoleReturnData(
            payable(address(testContract)), 0, calldata_, Operation.Call, ROLE_KEY, false
        );
        assertTrue(success);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_execWithRoleReturnData_returnsFalseNoPersistenceWhenInnerFailShouldRevertFalse() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        vm.prank(invoker);
        (bool success, ) = roles.execTransactionWithRoleReturnData(
            payable(address(testContract)), 0, calldata_, Operation.Call, ROLE_KEY, false
        );
        assertFalse(success);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    function test_execWithRoleReturnData_revertsNoPersistenceWhenInnerFailShouldRevertTrue() public {
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        vm.prank(invoker);
        vm.expectRevert(IRolesError.ModuleTransactionFailed.selector);
        roles.execTransactionWithRoleReturnData(
            payable(address(testContract)), 0, calldata_, Operation.Call, ROLE_KEY, true
        );

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }
}
