// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract PluckIntegrityTest is OneParamSetup {
    function test_integrityRevertsUnsuitableParameterType() public {
        // Pluck with Dynamic encoding should revert (only Static/EtherValue/Array)
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Dynamic,
            operator: Operator.Pluck,
            compValue: hex"00"
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableParameterType.selector, 1));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        // Pluck with empty compValue should revert (needs 1 byte)
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
            operator: Operator.Pluck,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsLeafNodeCannotHaveChildren() public {
        // Pluck(Static) cannot have children
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
            operator: Operator.Pluck,
            compValue: hex"00"
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.LeafNodeCannotHaveChildren.selector, 1));
        roles.packConditions(conditions);
    }
}
