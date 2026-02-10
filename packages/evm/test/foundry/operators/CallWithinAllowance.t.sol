// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../Base.t.sol";

contract CallWithinAllowanceTest is BaseTest {
    bytes32 internal ALLOWANCE_KEY = keccak256("CWA_ALLOWANCE");
    bytes4 internal selector1 = bytes4(keccak256("doNothing()"));

    function _setupCallWithinAllowance() internal {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });

        vm.startPrank(owner);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), selector1, packed, ExecutionOptions.None
        );
        vm.stopPrank();
    }

    function test_successFromBalance() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1, 0, 0, 0, 0);

        _setupCallWithinAllowance();

        // First call passes
        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));

        // Second call fails
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));
    }

    function test_multipleChecksFromBalance() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 2, 0, 0, 0, 0);

        _setupCallWithinAllowance();

        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));
        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));
    }

    function test_successFromRefill() public {
        vm.prank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 0, type(uint128).max, 1, 1000, 0);

        _setupCallWithinAllowance();

        // Immediately fails (balance=0)
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));

        // After one period, balance refills to 1
        vm.warp(block.timestamp + 1000);

        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));
    }

    function test_andWithParamComparison() public {
        bytes4 fnSel = bytes4(keccak256("fn(uint256)"));

        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 2, 0, 0, 0, 0);

        // And(Matches(EqualTo(42)), CallWithinAllowance)
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
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(42))
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(
            roleKey, address(testContract), fnSel, packed, ExecutionOptions.None
        );
        vm.stopPrank();

        _exec(address(testContract), 0, abi.encodeWithSelector(fnSel, uint256(42)));
        _exec(address(testContract), 0, abi.encodeWithSelector(fnSel, uint256(42)));

        // Third call - allowance exhausted
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _exec(address(testContract), 0, abi.encodeWithSelector(fnSel, uint256(42)));
    }

    function test_standaloneRootWithAllowTarget() public {
        vm.startPrank(owner);
        roles.setAllowance(ALLOWANCE_KEY, 1, 0, 0, 0, 0);

        // Remove scoped target, use allowTarget with condition
        roles.revokeTarget(roleKey, address(testContract));

        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });

        bytes memory packed = roles.packConditions(conditions);
        roles.allowTarget(roleKey, address(testContract), packed, ExecutionOptions.None);
        vm.stopPrank();

        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _exec(address(testContract), 0, abi.encodeWithSelector(selector1));
    }

    function test_integrityRevertsUnsuitableParameterType() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.CallWithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableParameterType.selector, 0));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsUnsuitableCompValue() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: hex"0102030405"
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 0));
        roles.packConditions(conditions);
    }

    function test_integrityRevertsLeafNodeCannotHaveChildren() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.CallWithinAllowance,
            compValue: abi.encode(ALLOWANCE_KEY)
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.LeafNodeCannotHaveChildren.selector, 0));
        roles.packConditions(conditions);
    }
}
