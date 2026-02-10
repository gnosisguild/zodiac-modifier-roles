// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../../contracts/__test__/mocks/MockDecoder.sol";
import "../../../contracts/types/Types.sol";

/// @title ABI Decoding Traversal Tests
/// @notice Verifies the ABI decoder traversal (via MockDecoder.inspect) correctly
///         resolves parameter locations for various encoding types.
///         NOTE: AbiEncoded with empty compValue defaults to 4 leading bytes (selector).
contract TraversalTest is Test {
    MockDecoder internal decoder;

    // Dummy 4-byte selector prefix for AbiEncoded data
    bytes4 internal constant SEL = bytes4(keccak256("foo()"));

    function setUp() public {
        decoder = new MockDecoder();
    }

    // =========================================================================
    // Static Parameters
    // =========================================================================

    /// @dev Single static parameter: location at offset 4, size 32.
    function test_singleStatic() public view {
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

        // AbiEncoded defaults to 4 leading bytes (selector)
        bytes memory data = abi.encodePacked(SEL, abi.encode(uint256(42)));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        assertEq(result.length, 2);
        // Root node
        assertEq(result[0].location, 0);
        // Static child at offset 4 (after selector)
        assertEq(result[1].location, 4);
        assertEq(result[1].size, 32);
        assertFalse(result[1].overflow);
    }

    /// @dev Two static parameters: sequential at 4 and 36.
    function test_twoStatics() public view {
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
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        bytes memory data = abi.encodePacked(SEL, abi.encode(uint256(100), uint256(200)));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        assertEq(result.length, 3);
        assertEq(result[1].location, 4);
        assertEq(result[1].size, 32);
        assertEq(result[2].location, 36);
        assertEq(result[2].size, 32);
    }

    // =========================================================================
    // Dynamic Parameters
    // =========================================================================

    /// @dev Single dynamic parameter: location resolved via offset pointer.
    function test_singleDynamic() public view {
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

        bytes memory data = abi.encodePacked(SEL, abi.encode(bytes(hex"aabbccdd")));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        assertEq(result.length, 2);
        assertFalse(result[1].overflow);
        // Dynamic parameter location is resolved via the offset pointer
        assertTrue(result[1].location > 4);
    }

    // =========================================================================
    // Mixed Static + Dynamic Parameters
    // =========================================================================

    /// @dev fn(uint256, bytes) - one static, one dynamic at top level.
    function test_staticAndDynamic() public view {
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
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: ""
        });

        // fn(uint256, bytes) = (42, hex"aabb")
        bytes memory data = abi.encodePacked(SEL, abi.encode(uint256(42), bytes(hex"aabb")));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        assertEq(result.length, 3);
        assertFalse(result[0].overflow);
        // Static at offset 4
        assertEq(result[1].location, 4);
        assertEq(result[1].size, 32);
        assertFalse(result[1].overflow);
        // Dynamic at resolved location (offset pointer at byte 36 points to data)
        assertFalse(result[2].overflow);
        assertTrue(result[2].location > 36);
    }

    // =========================================================================
    // Array Parameters
    // =========================================================================

    /// @dev Array of static elements.
    function test_arrayOfStatics() public view {
        // fn(uint256[])
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
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        uint256[] memory arr = new uint256[](3);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        bytes memory data = abi.encodePacked(SEL, abi.encode(arr));

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        // Root + array + 3 element children = 5 nodes
        assertEq(result.length, 5);
        assertFalse(result[0].overflow);
        assertFalse(result[1].overflow);
        // Array elements should not overflow
        for (uint256 i = 2; i < 5; i++) {
            assertFalse(result[i].overflow);
            assertEq(result[i].size, 32);
        }
    }

    // =========================================================================
    // Tuple (all-static, i.e., inlined)
    // =========================================================================

    /// @dev fn(uint256, (uint256, uint256)) where tuple is all-static (inlined).
    function test_inlinedTuple() public view {
        // AbiEncoded -> [Static, Tuple -> [Static, Static]]
        // An all-static tuple is inlined (no offset pointer)
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
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[3] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditions[4] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        // fn(uint256, (uint256, uint256))
        // ABI: selector | uint256(1) | uint256(2) | uint256(3)
        // The all-static tuple (2,3) is encoded inline
        bytes memory data = abi.encodePacked(
            SEL,
            abi.encode(uint256(1), uint256(2), uint256(3))
        );

        MockDecoder.FlatPayload[] memory result = decoder.inspect(data, conditions);

        // Root + Static + Tuple + 2 Static children = 5
        assertEq(result.length, 5);
        for (uint256 i = 0; i < result.length; i++) {
            assertFalse(result[i].overflow);
        }

        // First param at 4
        assertEq(result[1].location, 4);
        // Tuple starts at 36 (inlined, right after first param)
        assertEq(result[2].location, 36);
        // Tuple's children
        assertEq(result[3].location, 36);  // first field
        assertEq(result[4].location, 68);  // second field
    }
}
