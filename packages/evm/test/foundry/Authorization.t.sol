// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";
import "../../contracts/__test__/fixtures/MultiSend.sol";
import "../../contracts/periphery/unwrappers/MultiSendUnwrapper.sol";

/// @title Authorization Tests
/// @notice Verifies transaction permission validation: clearance levels, condition
///         enforcement, execution options, transaction unwrapping, and consumption tracking.
contract AuthorizationTest is BaseTest {
    bytes32 ROLE_KEY;

    function setUp() public override {
        _deploySingletonFactory();

        owner = makeAddr("owner");
        member = makeAddr("member");

        vm.startPrank(owner);

        avatar = new TestAvatar();
        testContract = new TestContract();
        roles = new Roles(owner, address(avatar), address(avatar));

        ROLE_KEY = keccak256("AUTH_TEST_ROLE");

        vm.stopPrank();
    }

    // =========================================================================
    // CLEARANCE - None
    // =========================================================================

    function test_clearanceNone_revertsTargetAddressNotAllowed() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        vm.stopPrank();

        // No allowTarget/scopeTarget called - target has no clearance
        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.TargetAddressNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    // =========================================================================
    // CLEARANCE - Target
    // =========================================================================

    function test_clearanceTarget_allowsAnyFunction() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        bytes4 doNothingSel = bytes4(keccak256("doNothing()"));

        // Can call doNothing
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(doNothingSel);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // Can call oneParamStatic
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );
    }

    function test_clearanceTarget_evaluatesTargetCondition() public {
        // Allow target with condition: first param must equal 100
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
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(100))
        });

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        bytes memory packed = roles.packConditions(conditions);
        roles.allowTarget(ROLE_KEY, address(testContract), packed, ExecutionOptions.None);
        vm.stopPrank();

        // oneParamStatic with 100 - should pass
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 100),
            Operation.Call
        );

        // oneParamStatic with 50 - should fail
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 50),
            Operation.Call
        );

        // twoParamsStatic with first param 100 - should pass
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("twoParamsStatic(uint256,uint256)", 100, 999),
            Operation.Call
        );

        // twoParamsStatic with first param 200 - should fail
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("twoParamsStatic(uint256,uint256)", 200, 999),
            Operation.Call
        );
    }

    // =========================================================================
    // CLEARANCE - Function
    // =========================================================================

    function test_clearanceFunction_allowsOnlyPermittedFunctions() public {
        bytes4 doNothingSel = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), doNothingSel, "", ExecutionOptions.None);
        vm.stopPrank();

        // doNothing is allowed
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(doNothingSel);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_clearanceFunction_revertsForUnpermittedSelector() public {
        bytes4 doNothingSel = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), doNothingSel, "", ExecutionOptions.None);
        vm.stopPrank();

        // oneParamStatic is NOT allowed
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );
    }

    function test_clearanceFunction_appliesFunctionSpecificConditions() public {
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

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
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(42))
        });

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(ROLE_KEY, address(testContract), selector, packed, ExecutionOptions.None);
        vm.stopPrank();

        // Call with 42 - should pass
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );

        // Call with 99 - should fail
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 99),
            Operation.Call
        );
    }

    // =========================================================================
    // CLEARANCE TRANSITIONS
    // =========================================================================

    function test_clearanceTransition_functionTightensPreviouslyAllowedTarget() public {
        bytes4 doNothingSel = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);

        // First allow entire target
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Both functions work
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(doNothingSel);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );

        // Now scope target (tightens to function-level)
        vm.startPrank(owner);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), doNothingSel, "", ExecutionOptions.None);
        vm.stopPrank();

        // doNothing still works
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(doNothingSel);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // oneParamStatic no longer works
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );
    }

    function test_clearanceTransition_targetLoosensScoped() public {
        bytes4 doNothingSel = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);

        // First scope target and only allow doNothing
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), doNothingSel, "", ExecutionOptions.None);
        vm.stopPrank();

        // oneParamStatic doesn't work
        vm.prank(member);
        vm.expectPartialRevert(IRolesError.FunctionNotAllowed.selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );

        // Now allow entire target (loosens)
        vm.prank(owner);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);

        // Now oneParamStatic works
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 42),
            Operation.Call
        );
    }

    function test_clearanceTransition_revokeTargetMakesAllowFunctionIneffective() public {
        bytes4 doNothingSel = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), doNothingSel, "", ExecutionOptions.None);
        vm.stopPrank();

        // doNothing works
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(doNothingSel);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // Revoke target
        vm.prank(owner);
        roles.revokeTarget(ROLE_KEY, address(testContract));

        // doNothing no longer works
        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.TargetAddressNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    // =========================================================================
    // CALLDATA VALIDATION
    // =========================================================================

    function test_calldata_allowsEmptyCalldata() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Empty calldata (0 bytes) is allowed
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_calldata_revertsFor1Byte() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(IRolesError.FunctionSignatureTooShort.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, hex"12", Operation.Call);
    }

    function test_calldata_revertsFor2Bytes() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(IRolesError.FunctionSignatureTooShort.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, hex"1234", Operation.Call);
    }

    function test_calldata_revertsFor3Bytes() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(IRolesError.FunctionSignatureTooShort.selector);
        roles.execTransactionFromModule(payable(address(testContract)), 0, hex"123456", Operation.Call);
    }

    // =========================================================================
    // EXECUTION OPTIONS - Target Clearance
    // =========================================================================

    function test_execOptions_target_sendNotAllowed() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Fund the avatar
        vm.deal(address(avatar), 1 ether);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.SendNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(payable(address(testContract)), 0.1 ether, "", Operation.Call);
    }

    function test_execOptions_target_sendAllowed() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.Send);
        vm.stopPrank();

        vm.deal(address(avatar), 1 ether);

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0.1 ether, "", Operation.Call);
    }

    function test_execOptions_target_delegateCallNotAllowed() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.DelegateCallNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.DelegateCall);
    }

    function test_execOptions_target_delegateCallAllowed() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.DelegateCall);
        vm.stopPrank();

        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.DelegateCall);
    }

    function test_execOptions_target_callAllowedRegardlessOfDelegateCallOption() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.DelegateCall);
        vm.stopPrank();

        // Regular call should work even if only DelegateCall enabled
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.Call);
    }

    function test_execOptions_target_bothAllowsSendAndDelegateCall() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.Both);
        vm.stopPrank();

        vm.deal(address(avatar), 1 ether);

        // Send with value works
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0.1 ether, "", Operation.Call);

        // DelegateCall works
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(testContract)), 0, "", Operation.DelegateCall);
    }

    // =========================================================================
    // EXECUTION OPTIONS - Function Clearance
    // =========================================================================

    function test_execOptions_function_sendNotAllowed() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);
        vm.stopPrank();

        vm.deal(address(avatar), 1 ether);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.SendNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0.1 ether,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_execOptions_function_sendAllowed() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.Send);
        vm.stopPrank();

        vm.deal(address(avatar), 1 ether);

        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0.1 ether,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_execOptions_function_delegateCallNotAllowed() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.None);
        vm.stopPrank();

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.DelegateCallNotAllowed.selector, address(testContract)));
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.DelegateCall
        );
    }

    function test_execOptions_function_delegateCallAllowed() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.DelegateCall);
        vm.stopPrank();

        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.DelegateCall
        );
    }

    function test_execOptions_function_callAllowedRegardlessOfDelegateCallOption() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.DelegateCall);
        vm.stopPrank();

        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
    }

    function test_execOptions_function_bothAllowsSendAndDelegateCall() public {
        bytes4 selector = bytes4(keccak256("doNothing()"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
        roles.allowFunction(ROLE_KEY, address(testContract), selector, "", ExecutionOptions.Both);
        vm.stopPrank();

        vm.deal(address(avatar), 1 ether);

        // Send with value works
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(testContract));
        emit TestContract.Invoked(selector);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0.1 ether,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );

        // DelegateCall works
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.DelegateCall
        );
    }

    // =========================================================================
    // TRANSACTION UNWRAPPING
    // =========================================================================

    function test_unwrapping_unwrapsAndAuthorizesBatch() public {
        MultiSend multisend = new MultiSend();
        MultiSendUnwrapper unwrapper = new MultiSendUnwrapper();

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);

        // Allow the inner target
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);

        // Register the unwrapper
        bytes4 multiSendSelector = MultiSend.multiSend.selector;
        roles.setTransactionUnwrapper(address(multisend), multiSendSelector, address(unwrapper));
        vm.stopPrank();

        // Encode batch
        bytes memory payload = _encodeMultisendPayload(
            address(testContract), 0, 0, abi.encodeWithSignature("doNothing()"),
            address(testContract), 0, 0, abi.encodeWithSignature("oneParamStatic(uint256)", 42)
        );
        bytes memory multisendData = abi.encodeWithSelector(MultiSend.multiSend.selector, payload);

        // Execute via multisend
        vm.prank(member);
        roles.execTransactionFromModule(payable(address(multisend)), 0, multisendData, Operation.DelegateCall);
    }

    function test_unwrapping_revertsIfUnwrappedTxUnauthorized() public {
        MultiSend multisend = new MultiSend();
        MultiSendUnwrapper unwrapper = new MultiSendUnwrapper();
        TestContract testContract2 = new TestContract();

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        bytes4 multiSendSelector = MultiSend.multiSend.selector;
        roles.setTransactionUnwrapper(address(multisend), multiSendSelector, address(unwrapper));
        vm.stopPrank();

        // Batch with first tx allowed, second tx NOT allowed
        bytes memory payload = _encodeMultisendPayload(
            address(testContract), 0, 0, abi.encodeWithSignature("doNothing()"),
            address(testContract2), 0, 0, abi.encodeWithSignature("doNothing()")
        );
        bytes memory multisendData = abi.encodeWithSelector(MultiSend.multiSend.selector, payload);

        vm.prank(member);
        vm.expectRevert(abi.encodeWithSelector(IRolesError.TargetAddressNotAllowed.selector, address(testContract2)));
        roles.execTransactionFromModule(payable(address(multisend)), 0, multisendData, Operation.DelegateCall);
    }

    // =========================================================================
    // CONSUMPTION TRACKING
    // =========================================================================

    function test_consumption_succeedsWithoutAllowanceConsumption() public {
        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.allowTarget(ROLE_KEY, address(testContract), "", ExecutionOptions.None);
        vm.stopPrank();

        // Execute without any allowance conditions
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("doNothing()"),
            Operation.Call
        );
        // No ConsumeAllowance event to check - just no revert
    }

    function test_consumption_persistsAfterSuccessfulExecution() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
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

        // Execute with param 100 - should consume 100 from allowance
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.ConsumeAllowance(ALLOWANCE_KEY, 100, 900);
        roles.execTransactionFromModule(
            payable(address(testContract)),
            0,
            abi.encodeWithSignature("oneParamStatic(uint256)", 100),
            Operation.Call
        );

        // Verify balance was persisted
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 900);
    }

    function test_consumption_aggregatesAcrossBatch() public {
        bytes32 ALLOWANCE_KEY = keccak256("TEST_ALLOWANCE");
        bytes4 selector = bytes4(keccak256("oneParamStatic(uint256)"));

        MultiSend multisend = new MultiSend();
        MultiSendUnwrapper unwrapper = new MultiSendUnwrapper();

        vm.startPrank(owner);
        roles.grantRole(member, ROLE_KEY, 0, 0, 0);
        roles.setDefaultRole(member, ROLE_KEY);
        roles.scopeTarget(ROLE_KEY, address(testContract));
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

        bytes4 multiSendSelector = MultiSend.multiSend.selector;
        roles.setTransactionUnwrapper(address(multisend), multiSendSelector, address(unwrapper));
        vm.stopPrank();

        // Batch of two transactions, each consuming from same allowance
        bytes memory payload = _encodeMultisendPayload(
            address(testContract), 0, 0, abi.encodeWithSignature("oneParamStatic(uint256)", 100),
            address(testContract), 0, 0, abi.encodeWithSignature("oneParamStatic(uint256)", 200)
        );
        bytes memory multisendData = abi.encodeWithSelector(MultiSend.multiSend.selector, payload);

        // Consumptions are aggregated: 100 + 200 = 300
        vm.prank(member);
        vm.expectEmit(true, true, true, true, address(roles));
        emit IRolesEvent.ConsumeAllowance(ALLOWANCE_KEY, 300, 700);
        roles.execTransactionFromModule(payable(address(multisend)), 0, multisendData, Operation.DelegateCall);

        // Verify final balance
        (uint128 balance,) = roles.accruedAllowance(ALLOWANCE_KEY);
        assertEq(balance, 700);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    function _encodeMultisendPayload(
        address to1, uint256 value1, uint8 op1, bytes memory data1,
        address to2, uint256 value2, uint8 op2, bytes memory data2
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            op1,
            to1,
            value1,
            data1.length,
            data1,
            op2,
            to2,
            value2,
            data2.length,
            data2
        );
    }
}
