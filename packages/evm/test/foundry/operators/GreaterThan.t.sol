// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract GreaterThanTest is OneParamSetup {
    function test_passesWhenValueGreater() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.GreaterThan,
            abi.encode(uint256(100))
        );

        bytes memory packed = _pack(c);
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );

        _invoke(101);
    }

    function test_failsWhenValueEqual() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.GreaterThan,
            abi.encode(uint256(100))
        );

        bytes memory packed = _pack(c);
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterLessThanAllowed,
                1,
                4
            )
        );
        _invoke(100);
    }

    function test_failsWhenValueLess() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.GreaterThan,
            abi.encode(uint256(100))
        );

        bytes memory packed = _pack(c);
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterLessThanAllowed,
                1,
                4
            )
        );
        _invoke(99);
    }

    function test_integrityChecks() public {
        // GreaterThan requires compValue
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(0, Encoding.Static, Operator.GreaterThan, "");

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(c);
    }
}
