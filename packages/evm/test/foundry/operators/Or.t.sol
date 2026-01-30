// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract OrTest is OneParamSetup {
    function _setupOrConditions() internal {
        // Or(EqualTo(10), EqualTo(20))
        ConditionFlat[] memory conditions = new ConditionFlat[](4);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(10))
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(20))
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_passesWhenFirstChildPasses() public {
        _setupOrConditions();
        _invoke(10);
    }

    function test_passesWhenSecondChildPasses() public {
        _setupOrConditions();
        _invoke(20);
    }

    function test_failsAllChildren() public {
        _setupOrConditions();

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(99);
    }

    function test_returnsConsumptionsFromPassingBranchOnly() public {
        bytes32 ALLOWANCE_A = keccak256("ALLOWANCE_A");
        bytes32 ALLOWANCE_B = keccak256("ALLOWANCE_B");

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_A, 1000, 0, 0, 0, 0);
        roles.setAllowance(ALLOWANCE_B, 1000, 0, 0, 0, 0);

        // Or(
        //   And(GreaterThan(50), WithinAllowance(A)),
        //   And(LessThan(50), WithinAllowance(B))
        // )
        ConditionFlat[] memory conditions = new ConditionFlat[](8);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: ""
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: ""
        });
        conditions[4] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue: abi.encode(uint256(50))
        });
        conditions[5] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_A)
        });
        conditions[6] = ConditionFlat({
            parent: 3,
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abi.encode(uint256(50))
        });
        conditions[7] = ConditionFlat({
            parent: 3,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_B)
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();

        // invoke(100) should pass via branch A, consuming from ALLOWANCE_A
        _invoke(100);

        (uint128 balanceA,) = roles.accruedAllowance(ALLOWANCE_A);
        (uint128 balanceB,) = roles.accruedAllowance(ALLOWANCE_B);
        assertEq(balanceA, 900);
        assertEq(balanceB, 1000);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Or,
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
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
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
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableChildCount.selector, 0));
        roles.packConditions(conditions);
    }
}
