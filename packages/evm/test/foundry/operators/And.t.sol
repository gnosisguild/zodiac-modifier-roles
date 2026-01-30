// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract AndOneParamTest is OneParamSetup {
    function _setupAndConditions() internal {
        // And(GreaterThan(10), LessThan(20))
        ConditionFlat[] memory conditions = new ConditionFlat[](4);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        // child of root Matches: And node
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: ""
        });
        // child of And: GreaterThan(10)
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue: abi.encode(uint256(10))
        });
        // child of And: LessThan(20)
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abi.encode(uint256(20))
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_passesWhenAllChildrenPass() public {
        _setupAndConditions();
        _invoke(15);
    }

    function test_failsOnFirstChild() public {
        _setupAndConditions();

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(5);
    }

    function test_failsOnSecondChild() public {
        _setupAndConditions();

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(25);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        // And with Static encoding should revert
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.And,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableParameterType.selector, 0));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        // And with non-empty compValue should revert
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: abi.encode(uint256(1))
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 0));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsUnsuitableChildCount() public {
        // And with zero children should revert
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableChildCount.selector, 0));
        roles.packConditions(conditions);
    }
}

contract AndConsumptionTest is TwoParamSetup {
    bytes32 internal ALLOWANCE_KEY = keccak256("AND_ALLOWANCE");

    function test_accumulatesConsumptions() public {
        // Both params consume from the same allowance
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

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
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );
        vm.stopPrank();

        // Both params consume from same allowance: 100 + 200 = 300
        _invoke(100, 200);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 700);
    }
}
