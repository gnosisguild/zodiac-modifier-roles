// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../Base.t.sol";

contract EmptyTest is BaseTest {
    function setUp() public override {
        super.setUp();

        ConditionFlat[] memory c = new ConditionFlat[](1);
        c[0] = ConditionFlat(0, Encoding.None, Operator.Empty, "");

        bytes memory packed = roles.packConditions(c);
        vm.prank(owner);
        roles.allowTarget(
            roleKey,
            address(testContract),
            packed,
            ExecutionOptions.None
        );
    }

    function test_passesWhenCalldataEmpty() public {
        _exec(address(testContract), 0, "");
    }

    function test_failsWhenCalldataNotEmpty() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.CalldataNotEmpty,
                0,
                0
            )
        );
        _exec(address(testContract), 0, hex"deadbeef");
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        ConditionFlat[] memory c = new ConditionFlat[](1);
        c[0] = ConditionFlat(0, Encoding.Static, Operator.Empty, "");

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableParameterType.selector, 0));
        roles.packConditions(c);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        ConditionFlat[] memory c = new ConditionFlat[](1);
        c[0] = ConditionFlat(
            0,
            Encoding.None,
            Operator.Empty,
            abi.encode(uint256(1))
        );

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 0));
        roles.packConditions(c);
    }

    function test_integrityRevertsLeafNodeCannotHaveChildren() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.None, Operator.Empty, "");
        c[1] = ConditionFlat(0, Encoding.Static, Operator.Pass, "");

        vm.expectRevert(abi.encodeWithSelector(IRolesError.LeafNodeCannotHaveChildren.selector, 0));
        roles.packConditions(c);
    }
}
