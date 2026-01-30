// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";
import "../../../contracts/__test__/mocks/MockPricing.sol";

contract WithinRatioTest is TwoParamSetup {
    // fn(uint256,uint256)
    // Tree (BFS):
    //   [0] parent=0, None, And             // root: And
    //   [1] parent=0, AbiEncoded, Matches   // child of And: Matches
    //   [2] parent=0, None, WithinRatio     // child of And: WithinRatio
    //   [3] parent=1, Static, Pluck(0)      // child of Matches: Pluck index 0
    //   [4] parent=1, Static, Pluck(1)      // child of Matches: Pluck index 1

    function _setupRatio(
        uint8 refPluckIdx,
        uint8 refDecimals,
        uint8 relPluckIdx,
        uint8 relDecimals,
        uint32 minRatio,
        uint32 maxRatio
    ) internal {
        ConditionFlat[] memory conditions = new ConditionFlat[](5);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue: abi.encodePacked(
                refPluckIdx, refDecimals, relPluckIdx, relDecimals, minRatio, maxRatio
            )
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: hex"00"
        });
        conditions[4] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: hex"01"
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function _setupRatioWithAdapters(
        uint8 refPluckIdx,
        uint8 refDecimals,
        uint8 relPluckIdx,
        uint8 relDecimals,
        uint32 minRatio,
        uint32 maxRatio,
        address refAdapter,
        address relAdapter
    ) internal {
        ConditionFlat[] memory conditions = new ConditionFlat[](5);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue: abi.encodePacked(
                refPluckIdx, refDecimals, relPluckIdx, relDecimals,
                minRatio, maxRatio, refAdapter, relAdapter
            )
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: hex"00"
        });
        conditions[4] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: hex"01"
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_maxRatio_passesAtBoundary() public {
        // maxRatio=9500 (95%), ratio = rel*10000/ref = 950*10000/1000 = 9500
        _setupRatio(0, 0, 1, 0, 0, 9500);
        _invoke(1000, 950);
    }

    function test_maxRatio_exceedsReverts() public {
        // ratio = 951*10000/1000 = 9510 > 9500
        _setupRatio(0, 0, 1, 0, 0, 9500);

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(1000, 951);
    }

    function test_minRatio_passesAtBoundary() public {
        // minRatio=9000, ratio = 900*10000/1000 = 9000
        _setupRatio(0, 0, 1, 0, 9000, 0);
        _invoke(1000, 900);
    }

    function test_minRatio_belowReverts() public {
        // ratio = 850*10000/1000 = 8500 < 9000
        _setupRatio(0, 0, 1, 0, 9000, 0);

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(1000, 850);
    }

    function test_withAdapter() public {
        // refPricing doubles value, relPricing is 1:1
        // ref = 500 * 2e18, rel = 900 * 1e18
        // ratio = 900e18 * 10000 / 1000e18 = 9000
        MockPricing refPricing = new MockPricing(2e18);
        MockPricing relPricing = new MockPricing(1e18);

        _setupRatioWithAdapters(
            0, 0, 1, 0, 9000, 0,
            address(refPricing), address(relPricing)
        );
        _invoke(500, 900);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](4);
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
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: hex"01"
        });
        conditions[3] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinRatio,
            compValue: abi.encodePacked(
                uint8(0), uint8(0), uint8(1), uint8(0), uint32(0), uint32(9500)
            )
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableParameterType.selector, 3));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        // WithinRatio at root with wrong compValue length
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue: hex"0000"
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 0));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsNoRatioProvided() public {
        // WithinRatio at root with both ratios = 0
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue: abi.encodePacked(
                uint8(0), uint8(0), uint8(1), uint8(0), uint32(0), uint32(0)
            )
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.WithinRatioNoRatioProvided.selector, 0));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsLeafNodeCannotHaveChildren() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](5);
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
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pluck,
            compValue: hex"01"
        });
        conditions[3] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue: abi.encodePacked(
                uint8(0), uint8(0), uint8(1), uint8(0), uint32(0), uint32(9500)
            )
        });
        conditions[4] = ConditionFlat({
            parent: 3,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.LeafNodeCannotHaveChildren.selector, 3));
        roles.packConditions(conditions);
    }
}
