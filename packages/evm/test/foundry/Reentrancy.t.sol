// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";
import "../../contracts/__test__/fixtures/ReentrancyChecker.sol";

/// @title Reentrancy Tests
/// @notice Verifies that the nonReentrant modifier on execTransactionWithRole
///         prevents reentrant calls.
contract ReentrancyTest is Test {
    Roles internal roles;
    TestAvatar internal avatar;
    ReentrancyChecker internal checker;

    address internal owner;
    address internal invoker;
    bytes32 internal ROLE_KEY;

    address internal constant SINGLETON_FACTORY = 0xce0042B868300000d44A59004Da54A005ffdcf9f;

    function setUp() public {
        // Deploy singleton factory for ImmutableStorage
        if (SINGLETON_FACTORY.code.length == 0) {
            MockSingletonFactory factory = new MockSingletonFactory();
            vm.etch(SINGLETON_FACTORY, address(factory).code);
        }

        owner = makeAddr("owner");
        invoker = makeAddr("invoker");
        ROLE_KEY = keccak256("REENTRANCY_ROLE");

        vm.startPrank(owner);

        avatar = new TestAvatar();
        roles = new Roles(owner, address(avatar), address(avatar));

        checker = new ReentrancyChecker(address(roles), ROLE_KEY);

        // Grant role and enable module for the invoker
        roles.enableModule(invoker);
        roles.grantRole(invoker, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(invoker, ROLE_KEY);

        // Grant role to the checker contract as well (needed for reentrant call)
        roles.grantRole(address(checker), ROLE_KEY, 0, 0, 0);

        // Allow target for checker address
        roles.allowTarget(ROLE_KEY, address(checker), "", ExecutionOptions.None);

        vm.stopPrank();
    }

    function test_reentrancyIsBlocked() public {
        // invoker calls execTransactionFromModule targeting checker.attack()
        vm.prank(invoker);
        roles.execTransactionFromModule(
            payable(address(checker)),
            0,
            abi.encodeCall(ReentrancyChecker.attack, ()),
            Operation.Call
        );

        // Verify:
        // 1. attack() was called
        assertTrue(checker.attackCalled(), "attack() should have been called");

        // 2. Reentrancy was caught
        assertTrue(checker.caughtReentrancy(), "reentrancy should have been caught");

        // 3. doNothing() was NOT called (reentrant call was blocked)
        assertFalse(checker.doNothingCalled(), "doNothing() should NOT have been called");
    }
}
