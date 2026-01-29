// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract BitmaskTest is DynamicParamSetup {
    function _allow(ConditionFlat[] memory c) internal {
        bytes memory packed = _pack(c);
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            packed,
            ExecutionOptions.None
        );
    }

    function test_passesWhenMaskedValueMatches() public {
        // mask=0xffff, expected=0xaabb, shift=0
        bytes memory compValue = abi.encodePacked(
            uint16(0), // shift
            bytes2(0xffff), // mask
            bytes2(0xaabb) // expected
        );

        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Bitmask,
            compValue
        );

        _allow(c);

        _invoke(hex"aabb");
    }

    function test_failsWhenMaskedValueDiffers() public {
        // mask=0xffff, expected=0xaabb, shift=0
        bytes memory compValue = abi.encodePacked(
            uint16(0), // shift
            bytes2(0xffff), // mask
            bytes2(0xaabb) // expected
        );

        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Bitmask,
            compValue
        );

        _allow(c);

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(hex"aacc");
    }

    function test_extractsShiftAndMask() public {
        // shift=3, mask=0xffff, expected=0xaabb
        bytes memory compValue = abi.encodePacked(
            uint16(3), // shift
            bytes2(0xffff), // mask
            bytes2(0xaabb) // expected
        );

        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Bitmask,
            compValue
        );

        _allow(c);

        // Data: 3 bytes padding + 0xaabb
        _invoke(hex"000000aabb");

        // Different value at that position should fail
        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(hex"000000ccdd");
    }

    function test_bitmaskOverflow() public {
        // shift=3, mask=0xffff, expected=0xaabb
        // but data is only 1 byte, so shift+mask exceeds data length
        bytes memory compValue = abi.encodePacked(
            uint16(3), // shift
            bytes2(0xffff), // mask
            bytes2(0xaabb) // expected
        );

        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Bitmask,
            compValue
        );

        _allow(c);

        vm.expectPartialRevert(IRolesError.ConditionViolation.selector);
        _invoke(hex"ab");
    }

    function test_ignoresBitsOutsideMask() public {
        // mask=0xf0, expected=0xa0, shift=0
        bytes memory compValue = abi.encodePacked(
            uint16(0), // shift
            bytes1(0xf0), // mask
            bytes1(0xa0) // expected
        );

        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Bitmask,
            compValue
        );

        _allow(c);

        // 0xab & 0xf0 = 0xa0, should pass
        _invoke(hex"ab");
    }

    function test_integrityChecks() public {
        // Bitmask requires compValue with at least 4 bytes (2 shift + 1 mask + 1 expected)
        ConditionFlat[] memory c = new ConditionFlat[](2);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Bitmask,
            "" // empty compValue
        );

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(c);
    }
}
