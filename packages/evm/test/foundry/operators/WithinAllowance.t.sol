// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract WithinAllowanceOneParamTest is OneParamSetup {
    bytes32 internal ALLOWANCE_KEY = keccak256("WA_ALLOWANCE");

    function _setupWithinAllowance(bytes memory compValue) internal {
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
            operator: Operator.WithinAllowance,
            compValue: compValue
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_passesWithEnoughBalance() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        _setupWithinAllowance(abi.encode(ALLOWANCE_KEY));

        _invoke(1000);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 0);
    }

    function test_failsExceedingBalance() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        _setupWithinAllowance(abi.encode(ALLOWANCE_KEY));

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(1001);
    }

    function test_passesWithRefill() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 2000, 600, 1000, 0);

        _setupWithinAllowance(abi.encode(ALLOWANCE_KEY));

        // After 1 period, balance accrues to 500 + 600 = 1100
        vm.warp(block.timestamp + 1000);

        _invoke(1100);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 0);
    }

    function test_failsExceedingUint128() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, type(uint128).max, 0, 0, 0, 0);

        _setupWithinAllowance(abi.encode(ALLOWANCE_KEY));

        // 2^128 overflows uint128
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(uint256(type(uint128).max) + 1);
    }

    function test_updatesTimestamp() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 2000, 100, 600, 0);

        _setupWithinAllowance(abi.encode(ALLOWANCE_KEY));

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        // Advance 2 full periods
        vm.warp(block.timestamp + 1200);

        _invoke(100);

        (,,,, uint64 newTimestamp) = roles.allowances(ALLOWANCE_KEY);
        assertEq(newTimestamp, initialTimestamp + 1200);
    }

    function test_decimalConversion() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, uint128(1000e18), 0, 0, 0, 0);

        // compValue: key + baseDecimals(18) + paramDecimals(6)
        bytes memory compValue = abi.encodePacked(
            ALLOWANCE_KEY,
            uint8(18),
            uint8(6)
        );

        _setupWithinAllowance(compValue);

        // Send 500e6 (500 USDC). Converts to 500e18 in allowance space
        _invoke(500e6);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, uint128(500e18));
    }

    function test_etherValue() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        // Setup a function with EtherValue WithinAllowance
        bytes4 selector2 = bytes4(keccak256("fn2(uint256)"));

        // Tree: And(Matches(Pass), WithinAllowance(EtherValue))
        ConditionFlat[] memory conditions = new ConditionFlat[](4);
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
            paramType: Encoding.EtherValue,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), selector2, packed, ExecutionOptions.Send
        );
        vm.stopPrank();

        // Fund the avatar
        vm.deal(address(avatar), 2000);

        // Invoke with msg.value = 500
        _exec(
            address(testContract),
            500,
            abi.encodeWithSelector(selector2, uint256(0))
        );

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 500);
    }

    function test_integrityRevertsUnsuitableParameterType() public {
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
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableParameterType.selector, 1));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
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
            operator: Operator.WithinAllowance,
            compValue: hex"0102030405"
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(conditions);
    }
}

contract WithinAllowanceTwoParamTest is TwoParamSetup {
    bytes32 internal ALLOWANCE_A = keccak256("WA_ALLOWANCE_A");
    bytes32 internal ALLOWANCE_B = keccak256("WA_ALLOWANCE_B");

    function test_consumesMultipleReferences() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_A, 1000, 0, 0, 0, 0);

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
            compValue: abi.encode(ALLOWANCE_A)
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_A)
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();

        _invoke(300, 400);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_A);
        assertEq(balance, 300);
    }

    function test_consumesDifferentAllowances() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_A, 1000, 0, 0, 0, 0);
        roles.setAllowance(ALLOWANCE_B, 500, 0, 0, 0, 0);

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
            compValue: abi.encode(ALLOWANCE_A)
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_B)
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();

        _invoke(200, 100);

        (uint128 balanceA,) = roles.accruedAllowance(ALLOWANCE_A);
        (uint128 balanceB,) = roles.accruedAllowance(ALLOWANCE_B);
        assertEq(balanceA, 800);
        assertEq(balanceB, 400);
    }
}
