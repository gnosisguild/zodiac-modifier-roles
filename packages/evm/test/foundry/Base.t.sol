// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../contracts/Roles.sol";
import "../../contracts/__test__/fixtures/TestAvatar.sol";
import "../../contracts/__test__/fixtures/TestContract.sol";
import "../../contracts/types/Types.sol";
import "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

/// @dev Minimal singleton factory that deploys initCode via CREATE2.
///      Etched at 0xce0042B868300000d44A59004Da54A005ffdcf9f for tests.
contract MockSingletonFactory {
    function deploy(bytes memory initCode, bytes32 salt) external returns (address) {
        address addr;
        assembly {
            addr := create2(0, add(initCode, 0x20), mload(initCode), salt)
        }
        return addr;
    }
}

abstract contract BaseTest is Test {
    Roles internal roles;
    TestAvatar internal avatar;
    TestContract internal testContract;

    address internal owner;
    address internal member;

    bytes32 internal roleKey;

    address internal constant SINGLETON_FACTORY = 0xce0042B868300000d44A59004Da54A005ffdcf9f;

    function setUp() public virtual {
        // Deploy singleton factory for ImmutableStorage
        _deploySingletonFactory();

        owner = makeAddr("owner");
        member = makeAddr("member");

        vm.startPrank(owner);

        avatar = new TestAvatar();
        testContract = new TestContract();

        roles = new Roles(owner, address(avatar), address(avatar));

        roleKey = keccak256("TEST_ROLE");

        roles.enableModule(member);
        roles.grantRole(member, roleKey, 0, 0, 0);
        roles.setDefaultRole(member, roleKey);
        roles.scopeTarget(roleKey, address(testContract));

        vm.stopPrank();
    }

    // ─── Helpers ────────────────────────────────────────────────────

    function _pack(ConditionFlat[] memory conditions) internal view returns (bytes memory) {
        if (conditions.length == 0) return "";
        return roles.packConditions(conditions);
    }

    function _exec(address to, uint256 value, bytes memory data, Operation operation) internal {
        vm.prank(member);
        roles.execTransactionFromModule(payable(to), value, data, operation);
    }

    function _exec(address to, uint256 value, bytes memory data) internal {
        _exec(to, value, data, Operation.Call);
    }

    function _execFrom(address from, address to, uint256 value, bytes memory data) internal {
        vm.prank(from);
        roles.execTransactionFromModule(payable(to), value, data, Operation.Call);
    }

    function _deploySingletonFactory() internal {
        if (SINGLETON_FACTORY.code.length == 0) {
            MockSingletonFactory factory = new MockSingletonFactory();
            vm.etch(SINGLETON_FACTORY, address(factory).code);
        }
    }
}
