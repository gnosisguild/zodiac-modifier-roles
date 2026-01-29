// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract PassTest is OneParamSetup {
    function test_allowsAnyParameterValue() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(0, Encoding.Static, Operator.Pass, "");

        bytes memory packed = _pack(c);
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );

        _invoke(0);
        _invoke(999);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Static,
            Operator.Pass,
            abi.encode(uint256(123))
        );

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(c);
    }
}
