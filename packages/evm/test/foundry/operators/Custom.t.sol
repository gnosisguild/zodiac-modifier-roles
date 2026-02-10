// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";
import "../../../contracts/__test__/fixtures/TestCustomChecker.sol";

contract CustomTest is OneParamSetup {
    TestCustomChecker internal checker;
    TestCustomCheckerNoInterface internal checkerNoInterface;
    TestCustomCheckerReverting internal checkerReverting;
    TestCustomCheckerWrongReturn internal checkerWrongReturn;

    function setUp() public override {
        super.setUp();
        checker = new TestCustomChecker();
        checkerNoInterface = new TestCustomCheckerNoInterface();
        checkerReverting = new TestCustomCheckerReverting();
        checkerWrongReturn = new TestCustomCheckerWrongReturn();
    }

    function _setupCustom(address checkerAddr) internal {
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
            operator: Operator.Custom,
            compValue: abi.encodePacked(checkerAddr)
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSelector, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_passesWhenAdapterReturnsTrue() public {
        _setupCustom(address(checker));
        _invoke(101);
    }

    function test_failsWhenAdapterReturnsFalse() public {
        _setupCustom(address(checker));

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(99);
    }

    function test_failsNoCodeAtAddress() public {
        address randomAddr = address(uint160(uint256(keccak256("random_no_code"))));
        _setupCustom(randomAddr);

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(101);
    }

    function test_failsWrongInterface() public {
        _setupCustom(address(checkerNoInterface));

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(101);
    }

    function test_failsReverting() public {
        _setupCustom(address(checkerReverting));

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(101);
    }

    function test_failsWrongReturn() public {
        _setupCustom(address(checkerWrongReturn));

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(101);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        // Custom with compValue shorter than 20 bytes
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
            operator: Operator.Custom,
            compValue: hex"0102030405"
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(conditions);
    }
}
