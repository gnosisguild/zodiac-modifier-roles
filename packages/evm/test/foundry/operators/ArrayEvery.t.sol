// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract ArrayEveryTest is ArrayParamSetup {
    function _setupArrayEveryLessThan(uint256 val) internal {
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArrayEvery,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abi.encode(val)
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_passesWhenAllElementsMatch() public {
        _setupArrayEveryLessThan(100);

        uint256[] memory arr = new uint256[](4);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        arr[3] = 40;
        _invoke(arr);
    }

    function test_failsWhenOneElementDoesntMatch() public {
        _setupArrayEveryLessThan(100);

        uint256[] memory arr = new uint256[](4);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 150;
        arr[3] = 40;

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(arr);
    }

    function test_passesWhenArrayEmpty() public {
        _setupArrayEveryLessThan(100);

        uint256[] memory arr = new uint256[](0);
        _invoke(arr);
    }

    function test_accumulatesConsumptions() public {
        bytes32 ALLOWANCE_KEY = keccak256("ARRAY_EVERY_ALLOWANCE");

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
            paramType: Encoding.Array,
            operator: Operator.ArrayEvery,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();

        // Each element consumed: 10+20+30+40 = 100
        uint256[] memory arr = new uint256[](4);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        arr[3] = 40;
        _invoke(arr);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.ArrayEvery,
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
            paramType: Encoding.Array,
            operator: Operator.ArrayEvery,
            compValue: hex"01"
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
        // ArrayEvery with 2 children (needs exactly 1)
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArrayEvery,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableChildCount.selector, 0));
        roles.packConditions(conditions);
    }
}
