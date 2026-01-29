// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract SignedIntGreaterThanTest is OneParamSignedSetup {
    function _allow(ConditionFlat[] memory c) internal {
        bytes memory packed = _pack(c);
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );
    }

    function test_passesWhenGreater() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.SignedIntGreaterThan,
            abi.encode(int256(100))
        );

        _allow(c);

        _invoke(int256(101));
    }

    function test_failsWhenEqual() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.SignedIntGreaterThan,
            abi.encode(int256(100))
        );

        _allow(c);

        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterLessThanAllowed,
                1,
                4
            )
        );
        _invoke(int256(100));
    }

    function test_handlesNegativeNumbers() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.SignedIntGreaterThan,
            abi.encode(int256(-50))
        );

        _allow(c);

        // -49 > -50, should pass
        _invoke(int256(-49));

        // -50 == -50, should fail
        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterLessThanAllowed,
                1,
                4
            )
        );
        _invoke(int256(-50));
    }

    function test_handlesNegativeNumbersLess() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.SignedIntGreaterThan,
            abi.encode(int256(-50))
        );

        _allow(c);

        // -51 < -50, should fail
        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterLessThanAllowed,
                1,
                4
            )
        );
        _invoke(int256(-51));
    }

    function test_integrityChecks() public {
        // SignedIntGreaterThan requires compValue
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.SignedIntGreaterThan,
            ""
        );

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(c);
    }
}
