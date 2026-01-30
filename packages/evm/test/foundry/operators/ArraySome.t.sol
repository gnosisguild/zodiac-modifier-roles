// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract ArraySomeTest is ArrayParamSetup {
    function _setupArraySomeEqualTo(uint256 val) internal {
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
            operator: Operator.ArraySome,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(val)
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_passesWhenAtLeastOneElementMatches() public {
        _setupArraySomeEqualTo(42);

        uint256[] memory arr = new uint256[](4);
        arr[0] = 1;
        arr[1] = 2;
        arr[2] = 42;
        arr[3] = 4;
        _invoke(arr);
    }

    function test_failsWhenNoElementMatches() public {
        _setupArraySomeEqualTo(42);

        uint256[] memory arr = new uint256[](4);
        arr[0] = 1;
        arr[1] = 2;
        arr[2] = 3;
        arr[3] = 4;

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(arr);
    }

    function test_failsWhenArrayEmpty() public {
        _setupArraySomeEqualTo(42);

        uint256[] memory arr = new uint256[](0);

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(arr);
    }

    function test_shortCircuitsOnFirstMatch() public {
        bytes32 ALLOWANCE_KEY = keccak256("ARRAY_SOME_ALLOWANCE");

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
            operator: Operator.ArraySome,
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

        // All elements match WithinAllowance, but ArraySome short-circuits
        // on first match - only first element (100) consumed
        uint256[] memory arr = new uint256[](3);
        arr[0] = 100;
        arr[1] = 200;
        arr[2] = 300;
        _invoke(arr);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.ArraySome,
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
            operator: Operator.ArraySome,
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
        // ArraySome with 2 children
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArraySome,
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
