// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";
import "../../contracts/__test__/fixtures/MultiSend.sol";
import "../../contracts/periphery/unwrappers/MultiSendUnwrapper.sol";

/// @title Allowance Tracking Tests
/// @notice Verifies state management for allowances: configuration, accrual,
///         consumption, settlement, and edge cases.
contract AllowanceTest is BaseTest {
    uint128 constant maxUint128 = type(uint128).max;

    bytes32 ROLE_KEY;
    bytes32 ALLOWANCE_KEY;

    function setUp() public override {
        _deploySingletonFactory();

        owner = makeAddr("owner");
        member = makeAddr("member");

        vm.startPrank(owner);

        avatar = new TestAvatar();
        testContract = new TestContract();
        roles = new Roles(owner, address(avatar), address(avatar));

        ROLE_KEY = keccak256("TEST_ROLE");
        ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");

        roles.enableModule(member);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));

        vm.stopPrank();
    }

    // =========================================================================
    // setAllowance - basic configuration
    // =========================================================================

    function test_setAllowance_setsBalance() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,,, uint128 balance,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(balance, 500);
    }

    function test_setAllowance_setsRefill() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (uint128 refill,,,,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(refill, 100);
    }

    function test_setAllowance_setsPeriod() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,, uint64 period,,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(period, 3600);
    }

    function test_setAllowance_emitsSetAllowanceEvent() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, false, address(roles));
        emit IRolesEvent.SetAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
    }

    // =========================================================================
    // setAllowance - default values
    // =========================================================================

    function test_setAllowance_defaultsMaxRefillToMaxUint128() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 0, 100, 3600, 0);

        (, uint128 maxRefill,,,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(maxRefill, maxUint128);
    }

    function test_setAllowance_defaultsTimestampToBlockTimestamp() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,,,, uint64 timestamp) = roles.allowances(ALLOWANCE_KEY);
        assertEq(timestamp, uint64(block.timestamp));
    }

    // =========================================================================
    // setAllowance - overwriting
    // =========================================================================

    function test_setAllowance_overwritesAllFields() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.setAllowance(ALLOWANCE_KEY, 999, 2000, 200, 7200, 0);
        vm.stopPrank();

        (uint128 refill, uint128 maxRefill, uint64 period, uint128 balance,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(balance, 999);
        assertEq(maxRefill, 2000);
        assertEq(refill, 200);
        assertEq(period, 7200);
    }

    function test_setAllowance_resetsTimestampWhenOverwriting() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 1000);

        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,,,, uint64 newTimestamp) = roles.allowances(ALLOWANCE_KEY);
        assertTrue(newTimestamp != initialTimestamp);
        assertEq(newTimestamp, uint64(block.timestamp));
    }

    // =========================================================================
    // updateAllowance
    // =========================================================================

    function test_updateAllowance_updatesRefillParametersOnly() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);
        vm.stopPrank();

        (uint128 refill, uint128 maxRefill, uint64 period,,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(maxRefill, 2000);
        assertEq(refill, 200);
        assertEq(period, 7200);
    }

    function test_updateAllowance_preservesBalance() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);
        vm.stopPrank();

        (,,, uint128 balance,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(balance, 500);
    }

    function test_updateAllowance_preservesTimestamp() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 1000);

        vm.prank(owner);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

        (,,,, uint64 afterTimestamp) = roles.allowances(ALLOWANCE_KEY);
        assertEq(afterTimestamp, initialTimestamp);
    }

    function test_updateAllowance_defaultsMaxRefillToMaxUint128() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.updateAllowance(ALLOWANCE_KEY, 0, 200, 7200);
        vm.stopPrank();

        (, uint128 maxRefill,,,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(maxRefill, maxUint128);
    }

    function test_updateAllowance_emitsSetAllowanceEvent() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.SetAllowance(ALLOWANCE_KEY, 500, 2000, 200, 7200, initialTimestamp);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);
        vm.stopPrank();
    }

    // =========================================================================
    // ACCRUAL (refill) - period = 0
    // =========================================================================

    function test_accrual_neverRefillsWhenPeriodZero() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 0, 0);

        vm.warp(block.timestamp + 9000);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 500);
    }

    function test_accrual_strictlyDecreasingWithoutRefill() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

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
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        bytes memory calldata_ = abi.encodeWithSignature("oneParamStatic(uint256)", 100);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);

        (uint128 balanceAfterFirst,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balanceAfterFirst, 900);

        vm.warp(block.timestamp + 10000);

        // Should still be 900 after time passes (no refill)
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);

        (uint128 balanceAfterSecond,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balanceAfterSecond, 800);
    }

    // =========================================================================
    // ACCRUAL - period-based
    // =========================================================================

    function test_accrual_doesNotAccrueBeforeOnePeriod() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 599);

        (uint128 balance, uint64 timestamp) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 500);
        assertEq(timestamp, initialTimestamp);
    }

    function test_accrual_accruesOneRefillAfterOnePeriod() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 600);

        (uint128 balance, uint64 timestamp) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 600); // 500 + 100
        assertEq(timestamp, initialTimestamp + 600);
    }

    function test_accrual_accruesMultipleRefillsAfterSeveralPeriods() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 3000); // 5 periods

        (uint128 balance, uint64 timestamp) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000); // 500 + 100 * 5
        assertEq(timestamp, initialTimestamp + 3000);
    }

    function test_accrual_onlyFullPeriodsPartialIgnored() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 2100); // 3.5 periods

        (uint128 balance, uint64 timestamp) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 800); // 500 + 100 * 3
        assertEq(timestamp, initialTimestamp + 1800); // 3 full periods
    }

    function test_accrual_zeroRefillKeepsBalanceUnchanged() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 10000, 0, 600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 3000); // 5 periods

        (uint128 balance, uint64 timestamp) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 500); // unchanged
        assertEq(timestamp, initialTimestamp + 3000); // still advances
    }

    // =========================================================================
    // ACCRUAL - maxRefill cap
    // =========================================================================

    function test_accrual_balanceCappedAtMaxRefill() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 600, 0);

        vm.warp(block.timestamp + 6000); // 10 periods, would be 1500 uncapped

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    function test_accrual_timestampUpdatesEvenWhenAtCap() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 1000, 100, 600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 3000); // 5 periods

        (uint128 balance, uint64 timestamp) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
        assertEq(timestamp, initialTimestamp + 3000);
    }

    function test_accrual_partialRefillReachingCapExcessDiscarded() public {
        // Balance 900, maxRefill 1000, refill 100 per period
        // After 2 periods would be 1100, but caps at 1000
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 900, 1000, 100, 600, 0);

        vm.warp(block.timestamp + 1200); // 2 periods

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    function test_accrual_initialBalanceAboveMaxRefillStaysUnchanged() public {
        // Initial balance (1500) exceeds maxRefill (1000)
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1500, 1000, 100, 600, 0);

        (,,,, uint64 initialTimestamp) = roles.allowances(ALLOWANCE_KEY);

        vm.warp(block.timestamp + 3000); // 5 periods

        (uint128 balance, uint64 timestamp) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1500); // unchanged, not capped down
        assertEq(timestamp, initialTimestamp + 3000);
    }

    // =========================================================================
    // MULTI-ENTRYPOINT ALLOWANCE
    // =========================================================================

    function test_multiEntrypoint_sharesAllowanceAcrossEntryPoints() public {
        MultiSend multisend = new MultiSend();
        MultiSendUnwrapper adapter = new MultiSendUnwrapper();

        bytes4 selector1 = bytes4(keccak256("oneParamStatic(uint256)"));
        bytes4 selector2 = bytes4(keccak256("twoParamsStatic(uint256,uint256)"));

        vm.startPrank(owner);
        roles.setTransactionUnwrapper(
            address(multisend),
            MultiSend.multiSend.selector,
            address(adapter)
        );

        roles.setAllowance(ALLOWANCE_KEY, 200, 0, 0, 0, 0);

        // oneParamStatic with WithinAllowance
        ConditionFlat[] memory cond1 = new ConditionFlat[](2);
        cond1[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        cond1[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed1 = roles.packConditions(cond1);
        roles.allowFunction(ROLE_KEY, address(testContract), selector1, packed1, ExecutionOptions.None);

        // twoParamsStatic: first param WithinAllowance, second Pass
        ConditionFlat[] memory cond2 = new ConditionFlat[](3);
        cond2[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        cond2[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        cond2[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        bytes memory packed2 = roles.packConditions(cond2);
        roles.allowFunction(ROLE_KEY, address(testContract), selector2, packed2, ExecutionOptions.None);
        vm.stopPrank();

        (uint128 balanceBefore,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balanceBefore, 200);

        // Batch: oneParamStatic(50) + twoParamsStatic(60, 999)
        bytes memory payload = abi.encodePacked(
            uint8(0), address(testContract), uint256(0), uint256(abi.encodeWithSignature("oneParamStatic(uint256)", 50).length), abi.encodeWithSignature("oneParamStatic(uint256)", 50),
            uint8(0), address(testContract), uint256(0), uint256(abi.encodeWithSignature("twoParamsStatic(uint256,uint256)", 60, 999).length), abi.encodeWithSignature("twoParamsStatic(uint256,uint256)", 60, 999)
        );
        bytes memory multisendData = abi.encodeWithSelector(MultiSend.multiSend.selector, payload);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(multisend)), 0, multisendData, Operation.DelegateCall);

        // Both consumed from same allowance: 200 - 50 - 60 = 90
        (uint128 balanceAfter,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balanceAfter, 90);
    }

    function test_multiEntrypoint_accumulatesConsumption() public {
        MultiSend multisend = new MultiSend();
        MultiSendUnwrapper adapter = new MultiSendUnwrapper();

        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.setTransactionUnwrapper(
            address(multisend),
            MultiSend.multiSend.selector,
            address(adapter)
        );
        roles.setAllowance(ALLOWANCE_KEY, 75, 0, 0, 0, 0);

        ConditionFlat[] memory cond = new ConditionFlat[](2);
        cond[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        cond[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed = roles.packConditions(cond);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        // 40 + 40 = 80 > 75, should fail
        bytes memory payload = abi.encodePacked(
            uint8(0), address(testContract), uint256(0), uint256(abi.encodeWithSignature("oneParamStatic(uint256)", 40).length), abi.encodeWithSignature("oneParamStatic(uint256)", 40),
            uint8(0), address(testContract), uint256(0), uint256(abi.encodeWithSignature("oneParamStatic(uint256)", 40).length), abi.encodeWithSignature("oneParamStatic(uint256)", 40)
        );
        bytes memory multisendData = abi.encodeWithSelector(MultiSend.multiSend.selector, payload);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.ConditionViolation.selector, Status.AllowanceExceeded, 1, 4));
        roles.execTransactionFromModule(payable(address(multisend)), 0, multisendData, Operation.DelegateCall);

        // Balance unchanged
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 75);
    }

    // =========================================================================
    // SETTLEMENT (persistence)
    // =========================================================================

    function test_settlement_persistsConsumptionOnSuccess() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

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
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        bytes memory calldata_ = abi.encodeWithSignature("oneParamStatic(uint256)", 100);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);

        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_settlement_emitsConsumeAllowanceOnSuccess() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

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
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        bytes memory calldata_ = abi.encodeWithSignature("oneParamStatic(uint256)", 100);

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.ConsumeAllowance(ALLOWANCE_KEY, 100, 900);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);
    }

    function test_settlement_doesNotPersistOnInnerFailure() public {
        bytes4 selector = bytes4(keccak256("fnThatMaybeReverts(uint256,bool)"));

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
            operator: Operator.Pass,
            compValue: ""
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        // Call with shouldRevert = true
        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);

        // Balance unchanged because inner call failed
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 1000);
    }

    function test_settlement_doesNotModifyAllowanceStateOnFailure() public {
        bytes4 selector = bytes4(keccak256("fnThatMaybeReverts(uint256,bool)"));

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 2000, 100, 3600, 0);

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
            operator: Operator.Pass,
            compValue: ""
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        (uint128 initialRefill, uint128 initialMaxRefill, uint64 initialPeriod, uint128 initialBalance,) =
            roles.allowances(ALLOWANCE_KEY);

        bytes memory calldata_ = abi.encodeWithSignature("fnThatMaybeReverts(uint256,bool)", 100, true);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);

        (uint128 refill, uint128 maxRefill, uint64 period, uint128 balance,) = roles.allowances(ALLOWANCE_KEY);
        assertEq(balance, initialBalance);
        assertEq(maxRefill, initialMaxRefill);
        assertEq(refill, initialRefill);
        assertEq(period, initialPeriod);
    }

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    function test_edgeCase_balanceAboveMaxRefillGetsConsumed() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        // Set balance (1300) > maxRefill (1000)
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1300, 1000, 100, 3600, 0);

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
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        bytes memory calldata_ = abi.encodeWithSignature("oneParamStatic(uint256)", 1200);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);

        // 1300 - 1200 = 100
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 100);
    }

    // =========================================================================
    // EVENT EMISSIONS
    // =========================================================================

    function test_events_emitsSetAllowanceOnSetAllowance() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, false, address(roles));
        emit IRolesEvent.SetAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);
    }

    function test_events_emitsSetAllowanceOnUpdateAllowance() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        vm.expectEmit(false, false, false, false, address(roles));
        emit IRolesEvent.SetAllowance(ALLOWANCE_KEY, 500, 2000, 200, 7200, 0);
        roles.updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);
        vm.stopPrank();
    }

    function test_events_emitsConsumeAllowanceOnConsumption() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

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
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        bytes memory calldata_ = abi.encodeWithSignature("oneParamStatic(uint256)", 100);

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.ConsumeAllowance(ALLOWANCE_KEY, 100, 900);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);
    }

    function test_events_consumeAllowanceIncludesAmountAndNewBalance() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 500, 0, 0, 0, 0);

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
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        bytes memory calldata_ = abi.encodeWithSignature("oneParamStatic(uint256)", 150);

        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.ConsumeAllowance(ALLOWANCE_KEY, 150, 350);
        roles.execTransactionFromModule(payable(address(testContract)), 0, calldata_, Operation.Call);
    }
}
