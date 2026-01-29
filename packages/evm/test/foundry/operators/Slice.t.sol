// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../OperatorBase.t.sol";

contract SliceTest is DynamicParamSetup {
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

    function test_extractsFromShiftAndSize() public {
        // Slice: shift=4, size=4 bytes => extract 4 bytes starting at offset 4
        // Child: EqualTo 0xdeadbeef
        ConditionFlat[] memory c = new ConditionFlat[](3);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Slice,
            abi.encodePacked(uint16(4), uint8(4))
        );
        c[2] = ConditionFlat(
            1,
            Encoding.Static,
            Operator.EqualTo,
            abi.encode(uint256(0xdeadbeef))
        );

        _allow(c);

        // 4 bytes of padding + 0xdeadbeef
        _invoke(hex"00000000deadbeef");
    }

    function test_extractsSingleByte() public {
        // Slice: shift=0, size=1
        // Child: EqualTo 0xab
        ConditionFlat[] memory c = new ConditionFlat[](3);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Slice,
            abi.encodePacked(uint16(0), uint8(1))
        );
        c[2] = ConditionFlat(
            1,
            Encoding.Static,
            Operator.EqualTo,
            abi.encode(uint256(0xab))
        );

        _allow(c);

        _invoke(hex"ab");
    }

    function test_extractsFull32Bytes() public {
        // Slice: shift=0, size=32
        // Child: EqualTo(12345)
        ConditionFlat[] memory c = new ConditionFlat[](3);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Slice,
            abi.encodePacked(uint16(0), uint8(32))
        );
        c[2] = ConditionFlat(
            1,
            Encoding.Static,
            Operator.EqualTo,
            abi.encode(uint256(12345))
        );

        _allow(c);

        _invoke(abi.encode(uint256(12345)));
    }

    function test_propagatesChildResult() public {
        // Slice -> GreaterThan(100)
        ConditionFlat[] memory c = new ConditionFlat[](3);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Slice,
            abi.encodePacked(uint16(0), uint8(32))
        );
        c[2] = ConditionFlat(
            1,
            Encoding.Static,
            Operator.GreaterThan,
            abi.encode(uint256(100))
        );

        _allow(c);

        // 101 > 100, passes
        _invoke(abi.encode(uint256(101)));

        // 100 == 100, fails
        vm.expectRevert(
            abi.encodeWithSelector(
                IRolesError.ConditionViolation.selector,
                Status.ParameterLessThanAllowed,
                2,
                68
            )
        );
        _invoke(abi.encode(uint256(100)));
    }

    function test_integrityChecks() public {
        // Slice requires compValue of exactly 3 bytes
        ConditionFlat[] memory c = new ConditionFlat[](3);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Slice,
            "" // empty, invalid
        );
        c[2] = ConditionFlat(
            1,
            Encoding.Static,
            Operator.EqualTo,
            abi.encode(uint256(1))
        );

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableCompValue.selector, 1));
        roles.packConditions(c);
    }

    function test_integritySliceChildNotStatic() public {
        // Slice child must resolve to Static type
        ConditionFlat[] memory c = new ConditionFlat[](3);
        c[0] = ConditionFlat(0, Encoding.AbiEncoded, Operator.Matches, "");
        c[1] = ConditionFlat(
            0,
            Encoding.Dynamic,
            Operator.Slice,
            abi.encodePacked(uint16(0), uint8(32))
        );
        c[2] = ConditionFlat(
            1,
            Encoding.Dynamic,
            Operator.EqualTo,
            abi.encode(uint256(1))
        );

        vm.expectRevert(abi.encodeWithSelector(IRolesError.SliceChildNotStatic.selector, 1));
        roles.packConditions(c);
    }
}
