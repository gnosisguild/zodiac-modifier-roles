// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../../contracts/__test__/mocks/MockDecoder.sol";
import "../../../contracts/types/Types.sol";

/// @title Overflow / Bounds Checking Tests
/// @notice Verifies that the ABI decoder correctly handles overflow and
///         out-of-bounds conditions in calldata.
///         NOTE: AbiEncoded with empty compValue defaults to 4 leading bytes.
contract OverflowTest is Test {
    MockDecoder internal decoder;

    // Dummy 4-byte selector prefix
    bytes4 internal constant SEL = bytes4(keccak256("foo()"));

    function setUp() public {
        decoder = new MockDecoder();
    }

    // =========================================================================
    // Static Overflow
    // =========================================================================

    /// @dev Calldata shorter than selector + 32 bytes for a static parameter.
    function test_overflowStaticTooShort() public view {
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
            operator: Operator.Pass,
            compValue: ""
        });

        // Only selector + 16 bytes, not enough for selector + 32 byte static
        bytes memory data = abi.encodePacked(SEL, hex"00112233445566778899aabbccddeeff");

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        // The root node should report overflow (child couldn't be located)
        assertEq(result.length, 1);
        assertTrue(result[0].overflow, "should flag overflow for short calldata");
    }

    // =========================================================================
    // Head Pointer Truncated
    // =========================================================================

    /// @dev If the head pointer for a dynamic parameter is truncated.
    function test_overflowHeadPointerTruncated() public view {
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
            operator: Operator.Pass,
            compValue: ""
        });

        // Only selector + 16 bytes - not enough for a 32-byte offset pointer
        bytes memory data = abi.encodePacked(SEL, hex"00112233445566778899aabbccddeeff");

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        assertEq(result.length, 1);
        assertTrue(result[0].overflow, "should flag overflow for truncated head pointer");
    }

    // =========================================================================
    // Accepts Exactly selector + 32 Bytes Static
    // =========================================================================

    /// @dev Exactly 4+32 bytes should be valid for a single static parameter.
    function test_acceptsExactly32BytesStatic() public view {
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
            operator: Operator.Pass,
            compValue: ""
        });

        bytes memory data = abi.encodePacked(SEL, abi.encode(uint256(42)));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        assertEq(result.length, 2);
        assertFalse(result[0].overflow, "root should not overflow");
        assertFalse(result[1].overflow, "exactly 32 bytes should not overflow");
        assertEq(result[1].location, 4);
        assertEq(result[1].size, 32);
    }

    // =========================================================================
    // Offset Beyond Length
    // =========================================================================

    /// @dev A dynamic parameter whose offset pointer points beyond data length.
    function test_overflowOffsetBeyondLength() public view {
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
            operator: Operator.Pass,
            compValue: ""
        });

        // Offset pointer says 0x1000 but data after selector is only 32 bytes
        bytes memory data = abi.encodePacked(SEL, abi.encode(uint256(0x1000)));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        // Overflow on root because child location is beyond data
        assertTrue(result[0].overflow, "offset beyond data length should overflow");
    }

    // =========================================================================
    // Declared Length Exceeds Remaining
    // =========================================================================

    /// @dev A dynamic parameter whose declared length exceeds remaining data.
    function test_overflowDeclaredLengthExceedsRemaining() public view {
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
            operator: Operator.Pass,
            compValue: ""
        });

        // offset is 0x20 (relative to block start at byte 4)
        // At offset 0x20 from byte 4: length = 0xFFFF (way too large)
        bytes memory data = abi.encodePacked(
            SEL,
            bytes32(uint256(0x20)),  // offset
            bytes32(uint256(0xFFFF)) // declared length (way too large)
        );

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        // Dynamic child located, but its length exceeds remaining data
        assertTrue(result.length >= 1);
        // Either root or child overflows
        bool anyOverflow = false;
        for (uint256 i = 0; i < result.length; i++) {
            if (result[i].overflow) anyOverflow = true;
        }
        assertTrue(anyOverflow, "declared length exceeding remaining should overflow");
    }

    // =========================================================================
    // Empty Array Does Not Overflow
    // =========================================================================

    /// @dev An empty array (length = 0) should not cause overflow.
    function test_emptyArrayDoesNotOverflow() public view {
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
            operator: Operator.ArrayEvery,
            compValue: ""
        });
        // Array child definition (element type)
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        // Encode an empty uint256[] array with selector prefix
        uint256[] memory emptyArr = new uint256[](0);
        bytes memory data = abi.encodePacked(SEL, abi.encode(emptyArr));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        // Should not report overflow for root or array node
        assertFalse(result[0].overflow, "root should not overflow");
        assertFalse(result[1].overflow, "empty array should not overflow");
    }
}
