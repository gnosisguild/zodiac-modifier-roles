// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract ArrayTailMatchesTest is ArrayParamSetup {
    function _setupTailMatches2(uint256 val1, uint256 val2) internal {
        ConditionFlat[] memory conditions = new ConditionFlat[](4);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArrayTailMatches,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(val1)
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(val2)
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_matchesWhenTailAligns() public {
        _setupTailMatches2(100, 200);

        // Exact match: [100, 200]
        uint256[] memory arr1 = new uint256[](2);
        arr1[0] = 100;
        arr1[1] = 200;
        _invoke(arr1);

        // Longer array, tail matches: [1, 2, 3, 100, 200]
        uint256[] memory arr2 = new uint256[](5);
        arr2[0] = 1;
        arr2[1] = 2;
        arr2[2] = 3;
        arr2[3] = 100;
        arr2[4] = 200;
        _invoke(arr2);
    }

    function test_failsWhenTailDoesntMatch() public {
        _setupTailMatches2(100, 200);

        uint256[] memory arr = new uint256[](2);
        arr[0] = 100;
        arr[1] = 999;

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(arr);
    }

    function test_failsWhenArrayTooShort() public {
        _setupTailMatches2(100, 200);

        uint256[] memory arr = new uint256[](1);
        arr[0] = 100;

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(arr);
    }

    function test_ignoresPrefixElements() public {
        // ArrayTailMatches with 1 child: EqualTo(42)
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
            operator: Operator.ArrayTailMatches,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(42))
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();

        // [999, 888, 42] - only last element checked
        uint256[] memory arr = new uint256[](3);
        arr[0] = 999;
        arr[1] = 888;
        arr[2] = 42;
        _invoke(arr);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.ArrayTailMatches,
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
            operator: Operator.ArrayTailMatches,
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
        // ArrayTailMatches with zero structural children
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArrayTailMatches,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableChildCount.selector, 0));
        roles.packConditions(conditions);
    }
}
