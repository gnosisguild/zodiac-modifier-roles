// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../../contracts/__test__/mocks/MockLocator.sol";
import "../../../contracts/types/Types.sol";

/// @title AbiLocation Overflow Tests
/// @notice Verifies AbiLocation-specific bounds checking via MockLocator.
///         AbiLocation.children() returns overflow=true when a child's computed
///         location exceeds data.length, but not when location == data.length
///         (boundary handling is delegated to the decoder).
contract OverflowAbiLocationTest is Test {
    MockLocator internal locator;

    function setUp() public {
        locator = new MockLocator();
    }

    // =========================================================================
    // Array with truncated length field
    // =========================================================================

    /// @dev An array location that doesn't have enough data for even the
    ///      length field (first 32 bytes) should report overflow.
    function test_overflowArrayLengthFieldTruncated() public view {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Array,
            operator: Operator.ArrayEvery,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        // Only 16 bytes - not enough for the 32-byte array length field
        bytes memory data = hex"00112233445566778899aabbccddeeff";

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertTrue(overflow, "should overflow when array length field is truncated");
    }

    // =========================================================================
    // Dynamic child with offset exceeding data
    // =========================================================================

    /// @dev A tuple with a dynamic child whose tail pointer points beyond data.
    function test_overflowDynamicChildTailBeyondData() public view {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: ""
        });

        // Only 32 bytes: head slot contains offset 0xFFFF which points way beyond
        bytes memory data = abi.encode(uint256(0xFFFF));

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertTrue(overflow, "should overflow when dynamic child tail exceeds data");
    }

    // =========================================================================
    // Head slot truncated for dynamic child
    // =========================================================================

    /// @dev A tuple with a dynamic child where the head slot itself is truncated.
    function test_overflowDynamicChildHeadTruncated() public view {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: ""
        });

        // Only 16 bytes - not enough for a 32-byte head slot
        bytes memory data = hex"00112233445566778899aabbccddeeff";

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertTrue(overflow, "should overflow when head slot for dynamic child is truncated");
    }

    // =========================================================================
    // Valid data does not overflow
    // =========================================================================

    /// @dev Properly encoded tuple data should not report overflow.
    function test_validTupleDoesNotOverflow() public view {
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
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

        bytes memory data = abi.encode(uint256(100), uint256(200));

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertFalse(overflow, "valid data should not overflow");
        assertEq(locations.length, 2);
        assertEq(locations[0], 0);
        assertEq(locations[1], 32);
    }

    // =========================================================================
    // Tuple at boundary (location == data.length) is not overflow
    // =========================================================================

    /// @dev A static child whose location equals data.length is not flagged
    ///      as overflow by AbiLocation (boundary is inclusive). The actual
    ///      content overflow is checked at the decoder level.
    function test_tupleStaticChildAtBoundaryNoOverflow() public view {
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
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

        // Only 32 bytes: first child at 0, second child at 32 == data.length
        // AbiLocation reports this as NOT overflow (location is not > data.length)
        bytes memory data = abi.encode(uint256(42));

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertFalse(overflow, "location == data.length is not overflow for AbiLocation");
        assertEq(locations.length, 2);
        assertEq(locations[0], 0);
        assertEq(locations[1], 32);
    }
}
