// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract ZipIteratorTwoArrayTest is TwoArrayParamSetup {
    // fn(uint256[],uint256[])
    // Tree for ZipEvery/ZipSome:
    //   Matches(AbiEncoded)                        [0] parent=0
    //     Pluck(Array, idx=0)                      [1] parent=0
    //       Pass(Static)                           [2] parent=1
    //     Pluck(Array, idx=1)                      [3] parent=0
    //       Pass(Static)                           [4] parent=3
    //     Zip*(None, compValue=[0,1])              [5] parent=0
    //       Matches(Tuple)                         [6] parent=5
    //         check0(Static)                       [7] parent=6
    //         check1(Static)                       [8] parent=6

    function _buildAndAllowZip(
        Operator zipOp,
        Operator check0Op,
        bytes memory check0Value,
        Operator check1Op,
        bytes memory check1Value
    ) internal {
        ConditionFlat[] memory conditions = new ConditionFlat[](9);
        // BFS order: parent indices must be non-decreasing
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.Pluck,
            compValue: hex"00"
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.Pluck,
            compValue: hex"01"
        });
        conditions[3] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: zipOp,
            compValue: hex"0001"
        });
        conditions[4] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[5] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[6] = ConditionFlat({
            parent: 3,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[7] = ConditionFlat({
            parent: 6,
            paramType: Encoding.Static,
            operator: check0Op,
            compValue: check0Value
        });
        conditions[8] = ConditionFlat({
            parent: 6,
            paramType: Encoding.Static,
            operator: check1Op,
            compValue: check1Value
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_failsWhenArraysHaveDifferentLengths() public {
        _buildAndAllowZip(
            Operator.ZipEvery,
            Operator.Pass, "",
            Operator.Pass, ""
        );

        uint256[] memory a = new uint256[](3);
        a[0] = 1; a[1] = 2; a[2] = 3;
        uint256[] memory b = new uint256[](2);
        b[0] = 1; b[1] = 2;

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(a, b);
    }

    function test_zipEveryPassesWhenAllPairsMatch() public {
        _buildAndAllowZip(
            Operator.ZipEvery,
            Operator.LessThan, abi.encode(uint256(100)),
            Operator.LessThan, abi.encode(uint256(100))
        );

        uint256[] memory a = new uint256[](3);
        a[0] = 10; a[1] = 20; a[2] = 30;
        uint256[] memory b = new uint256[](3);
        b[0] = 40; b[1] = 50; b[2] = 60;

        _invoke(a, b);
    }

    function test_zipEveryFailsWhenOnePairDoesntMatch() public {
        _buildAndAllowZip(
            Operator.ZipEvery,
            Operator.LessThan, abi.encode(uint256(100)),
            Operator.LessThan, abi.encode(uint256(100))
        );

        uint256[] memory a = new uint256[](3);
        a[0] = 10; a[1] = 20; a[2] = 30;
        uint256[] memory b = new uint256[](3);
        b[0] = 40; b[1] = 150; b[2] = 60;

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(a, b);
    }

    function test_zipSomePassesWhenOnePairMatches() public {
        _buildAndAllowZip(
            Operator.ZipSome,
            Operator.EqualTo, abi.encode(uint256(10)),
            Operator.EqualTo, abi.encode(uint256(20))
        );

        uint256[] memory a = new uint256[](3);
        a[0] = 99; a[1] = 10; a[2] = 99;
        uint256[] memory b = new uint256[](3);
        b[0] = 99; b[1] = 20; b[2] = 99;

        _invoke(a, b);
    }

    function test_zipSomeFailsWhenNoPairMatches() public {
        _buildAndAllowZip(
            Operator.ZipSome,
            Operator.EqualTo, abi.encode(uint256(10)),
            Operator.EqualTo, abi.encode(uint256(20))
        );

        uint256[] memory a = new uint256[](2);
        a[0] = 10; a[1] = 99;
        uint256[] memory b = new uint256[](2);
        b[0] = 99; b[1] = 20;

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(a, b);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        // ZipEvery with non-None paramType (at root for simplicity)
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.ZipEvery,
            compValue: hex"0001"
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableParameterType.selector, 0));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        // ZipEvery with less than 2 bytes in compValue
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.ZipEvery,
            compValue: hex"00"
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 0));
        roles.packConditions(conditions);
    }
}

contract ZipIteratorThreeArrayTest is ThreeArrayParamSetup {
    function test_zipsThreeArrays() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](12);
        // BFS order: parent indices must be non-decreasing
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.Pluck,
            compValue: hex"00"
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.Pluck,
            compValue: hex"01"
        });
        conditions[3] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.Pluck,
            compValue: hex"02"
        });
        conditions[4] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.ZipEvery,
            compValue: hex"000102"
        });
        conditions[5] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[6] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[7] = ConditionFlat({
            parent: 3,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[8] = ConditionFlat({
            parent: 4,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[9] = ConditionFlat({
            parent: 8,
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abi.encode(uint256(1000))
        });
        conditions[10] = ConditionFlat({
            parent: 8,
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abi.encode(uint256(1000))
        });
        conditions[11] = ConditionFlat({
            parent: 8,
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abi.encode(uint256(1000))
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();

        uint256[] memory a = new uint256[](2);
        a[0] = 10; a[1] = 20;
        uint256[] memory b = new uint256[](2);
        b[0] = 30; b[1] = 40;
        uint256[] memory c = new uint256[](2);
        c[0] = 50; c[1] = 60;

        _invoke(a, b, c);
    }
}
