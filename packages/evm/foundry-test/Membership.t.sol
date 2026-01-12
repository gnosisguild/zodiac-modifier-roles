// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Operation} from "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

import {Roles} from "../contracts/Roles.sol";
import {ConditionFlat} from "../contracts/types/Condition.sol";
import {ExecutionOptions} from "../contracts/types/Permission.sol";
import {IRolesError} from "../contracts/types/RolesError.sol";

import {TestAvatar} from "../contracts/__test__/fixtures/TestAvatar.sol";
import {TestContract} from "../contracts/__test__/fixtures/TestContract.sol";

import {BaseTest, Vm} from "./Base.t.sol";

contract MembershipTest is BaseTest {
    uint64 private constant MAX_UINT64 = type(uint64).max;
    bytes32 private constant UPDATE_ROLE_SIG =
        keccak256("UpdateRole(bytes32,address,uint64,uint64,uint128)");
    bytes32 private constant REVOKE_ROLE_SIG =
        keccak256("RevokeRole(bytes32,address)");

    Roles private roles;
    TestAvatar private avatar;
    TestContract private testContract;
    address private owner;
    address private member;
    bytes32 private roleKey;

    function setUp() public {
        owner = address(0x100);
        member = address(0x200);

        vm.warp(1_700_000_000);

        avatar = new TestAvatar();
        roles = new Roles(owner, address(avatar), address(avatar));
        testContract = new TestContract();
        roleKey = keccak256("ROLE_KEY");
    }

    function testRevertsNoMembershipWhenModuleHasNoMembership() public {
        vm.prank(owner);
        roles.enableModule(member);
        vm.prank(owner);
        roles.setDefaultRole(member, roleKey);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.NoMembership.selector));
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testRevertsNoMembershipAfterMembershipRevoked() public {
        _grantDefaultRole(0, 0, 0);
        _allowTarget(roleKey);

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        vm.prank(owner);
        roles.revokeRole(member, roleKey);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.NoMembership.selector));
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testRejectsZeroRoleEvenWithMembership() public {
        bytes32 zeroRole = bytes32(0);

        vm.prank(owner);
        roles.grantRole(member, zeroRole, 0, 0, 0);
        vm.prank(owner);
        roles.setDefaultRole(member, zeroRole);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.NoMembership.selector));
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testRevertsMembershipNotYetValidBeforeStart() public {
        uint64 futureStart = uint64(block.timestamp + 3600);

        _grantDefaultRole(futureStart, 0, 0);
        _allowTarget(roleKey);

        vm.prank(member);
        vm.expectRevert(
            abi.encodeWithSelector(IRolesError.MembershipNotYetValid.selector)
        );
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testSucceedsAtExactlyStartTimestamp() public {
        uint64 start = uint64(block.timestamp + 100);

        _grantDefaultRole(start, 0, 0);
        _allowTarget(roleKey);

        vm.warp(start);

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testSucceedsWithinValidWindow() public {
        uint64 start = uint64(block.timestamp - 100);
        uint64 end = uint64(block.timestamp + 3600);

        _grantDefaultRole(start, end, 0);
        _allowTarget(roleKey);

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testSucceedsAtExactlyEndTimestamp() public {
        uint64 end = uint64(block.timestamp + 100);

        _grantDefaultRole(0, end, 0);
        _allowTarget(roleKey);

        vm.warp(end);

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testRevertsMembershipExpiredAfterEnd() public {
        uint64 end = uint64(block.timestamp + 100);

        _grantDefaultRole(0, end, 0);
        _allowTarget(roleKey);

        vm.warp(end + 1);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.MembershipExpired.selector));
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testDoesNotDecrementForUnlimitedUses() public {
        _grantDefaultRole(0, 0, 0);
        _allowTarget(roleKey);

        for (uint256 i = 0; i < 5; i++) {
            vm.prank(member);
            roles.execTransactionFromModule(
                address(testContract),
                0,
                "",
                Operation.Call
            );
        }
    }

    function testDoesNotEmitUpdateRoleForUnlimitedUses() public {
        _grantDefaultRole(0, 0, 0);
        _allowTarget(roleKey);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertNoEvent(UPDATE_ROLE_SIG, address(roles), logs);
    }

    function testDoesNotEmitRevokeRoleForUnlimitedUses() public {
        _grantDefaultRole(0, 0, 0);
        _allowTarget(roleKey);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertNoEvent(REVOKE_ROLE_SIG, address(roles), logs);
    }

    function testDecrementsUsesLeftOnSuccessfulExecution() public {
        _grantDefaultRole(0, 0, 3);
        _allowTarget(roleKey);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertUpdateRole(roleKey, member, 0, MAX_UINT64, 2, address(roles), logs);
    }

    function testPreservesStartEndAfterDecrement() public {
        uint64 start = uint64(block.timestamp - 100);
        uint64 end = uint64(block.timestamp + 10000);

        _grantDefaultRole(start, end, 5);
        _allowTarget(roleKey);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertUpdateRole(roleKey, member, start, end, 4, address(roles), logs);
    }

    function testDoesNotDecrementOnFailedInnerExecution() public {
        _grantDefaultRole(0, 0, 2);
        _allowTarget(roleKey);

        bytes memory revertingData = abi.encodeWithSignature("fnThatReverts()");

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            revertingData,
            Operation.Call
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertNoEvent(UPDATE_ROLE_SIG, address(roles), logs);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        logs = vm.getRecordedLogs();
        _assertUpdateRole(roleKey, member, 0, MAX_UINT64, 1, address(roles), logs);
    }

    function testEmitsUpdateRoleWithDecrementedUsesLeft() public {
        _grantDefaultRole(0, 0, 5);
        _allowTarget(roleKey);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertUpdateRole(roleKey, member, 0, MAX_UINT64, 4, address(roles), logs);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        logs = vm.getRecordedLogs();
        _assertUpdateRole(roleKey, member, 0, MAX_UINT64, 3, address(roles), logs);
    }

    function testRevokesMembershipWhenUsesReachZero() public {
        _grantDefaultRole(0, 0, 1);
        _allowTarget(roleKey);

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.NoMembership.selector));
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function testEmitsRevokeRoleWhenUsesReachZero() public {
        _grantDefaultRole(0, 0, 1);
        _allowTarget(roleKey);

        vm.recordLogs();

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        Vm.Log[] memory logs = vm.getRecordedLogs();
        _assertRevokeRole(roleKey, member, address(roles), logs);
    }

    function testRevertsNoMembershipAfterExhaustion() public {
        _grantDefaultRole(0, 0, 2);
        _allowTarget(roleKey);

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        vm.prank(member);
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.NoMembership.selector));
        roles.execTransactionFromModule(
            address(testContract),
            0,
            "",
            Operation.Call
        );
    }

    function _grantDefaultRole(uint64 start, uint64 end, uint128 usesLeft) internal {
        vm.prank(owner);
        roles.grantRole(member, roleKey, start, end, usesLeft);
        vm.prank(owner);
        roles.setDefaultRole(member, roleKey);
    }

    function _allowTarget(bytes32 key) internal {
        ConditionFlat[] memory conditions = new ConditionFlat[](0);
        vm.prank(owner);
        roles.allowTarget(key, address(testContract), conditions, ExecutionOptions.None);
    }

    function _assertNoEvent(
        bytes32 signature,
        address emitter,
        Vm.Log[] memory logs
    ) internal pure {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter == emitter && logs[i].topics.length > 0) {
                if (logs[i].topics[0] == signature) {
                    revert("unexpected event");
                }
            }
        }
    }

    function _assertUpdateRole(
        bytes32 expectedRole,
        address expectedModule,
        uint64 expectedStart,
        uint64 expectedEnd,
        uint128 expectedUsesLeft,
        address emitter,
        Vm.Log[] memory logs
    ) internal pure {
        bool found;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0) {
                continue;
            }
            if (logs[i].topics[0] != UPDATE_ROLE_SIG) {
                continue;
            }
            if (logs[i].emitter != emitter) {
                continue;
            }
            (bytes32 role, address module, uint64 start, uint64 end, uint128 usesLeft) =
                abi.decode(logs[i].data, (bytes32, address, uint64, uint64, uint128));
            assertEq(role, expectedRole, "update roleKey mismatch");
            assertEq(module, expectedModule, "update module mismatch");
            assertEq(uint256(start), uint256(expectedStart), "update start mismatch");
            assertEq(uint256(end), uint256(expectedEnd), "update end mismatch");
            assertEq(uint256(usesLeft), uint256(expectedUsesLeft), "update usesLeft mismatch");
            found = true;
            break;
        }
        assertTrue(found, "UpdateRole not emitted");
    }

    function _assertRevokeRole(
        bytes32 expectedRole,
        address expectedModule,
        address emitter,
        Vm.Log[] memory logs
    ) internal pure {
        bool found;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0) {
                continue;
            }
            if (logs[i].topics[0] != REVOKE_ROLE_SIG) {
                continue;
            }
            if (logs[i].emitter != emitter) {
                continue;
            }
            (bytes32 role, address module) =
                abi.decode(logs[i].data, (bytes32, address));
            assertEq(role, expectedRole, "revoke roleKey mismatch");
            assertEq(module, expectedModule, "revoke module mismatch");
            found = true;
            break;
        }
        assertTrue(found, "RevokeRole not emitted");
    }

}
