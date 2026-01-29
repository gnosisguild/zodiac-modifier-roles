// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../Base.t.sol";

contract EqualToAvatarTest is BaseTest {
    bytes4 internal fnSelector = bytes4(keccak256("fn(address)"));

    function setUp() public override {
        super.setUp();

        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(0, Encoding.Static, Operator.EqualToAvatar, "");

        bytes memory packed = roles.packConditions(c);
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );
    }

    function test_matchesWhenParameterEqualsAvatar() public {
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, address(avatar))
        );
    }

    function test_failsWhenParameterNotAvatar() public {
        address random = makeAddr("random");
        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterNotAllowed,
                1,
                4
            )
        );
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, random)
        );
    }

    function test_matchesNewAvatarAfterChange() public {
        address newAvatar = makeAddr("newAvatar");

        vm.prank(owner);
        roles.setAvatar(newAvatar);

        // New avatar address passes
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, newAvatar)
        );

        // Old avatar address fails
        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterNotAllowed,
                1,
                4
            )
        );
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, address(avatar))
        );
    }

    function test_integrityChecks() public {
        // EqualToAvatar must not have a compValue
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.EqualToAvatar,
            abi.encode(address(1))
        );

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(c);
    }
}
