// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../../contracts/__test__/mocks/MockLocator.sol";
import "../../../contracts/types/Types.sol";

/// @title ABI Location Tests
/// @notice Verifies ABI parameter location computation for various
///         parent-child encoding combinations using MockLocator.
contract AbiLocationTest is Test {
    MockLocator internal locator;

    function setUp() public {
        locator = new MockLocator();
    }

    // =========================================================================
    // Tuple -> Static (T->S)
    // =========================================================================

    /// @dev Tuple with two static children: locations should be sequential
    ///      at 32-byte intervals from the parent location.
    function test_tupleToStatic() public view {
        // Condition tree: Matches(Tuple) -> [Pass(Static), Pass(Static)]
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

        // Encode: (uint256, uint256) = (111, 222)
        bytes memory data = abi.encode(uint256(111), uint256(222));

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertFalse(overflow);
        assertEq(locations.length, 2);
        assertEq(locations[0], 0);  // first static at offset 0
        assertEq(locations[1], 32); // second static at offset 32
    }

    // =========================================================================
    // Tuple -> Dynamic (T->D)
    // =========================================================================

    /// @dev Tuple with one static and one dynamic child: the dynamic child
    ///      location should resolve via tail pointer.
    function test_tupleToDynamic() public view {
        // Condition tree: Matches(Tuple) -> [Pass(Static), Pass(Dynamic)]
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
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: ""
        });

        // Encode: (uint256, bytes) = (42, hex"aabb")
        bytes memory data = abi.encode(uint256(42), bytes(hex"aabb"));

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertFalse(overflow);
        assertEq(locations.length, 2);
        assertEq(locations[0], 0); // static at offset 0
        // Dynamic child goes through tail pointer: head slot at offset 32 points to data
        assertTrue(locations[1] > 32); // Dynamic location resolved via offset
    }

    // =========================================================================
    // Array -> Static (A->S)
    // =========================================================================

    /// @dev Array of statics: first 32 bytes hold length, followed by elements.
    function test_arrayToStatic() public view {
        // Condition tree: ArrayEvery(Array) -> [Pass(Static)]
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

        // Encode: uint256[] with 3 elements
        uint256[] memory arr = new uint256[](3);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        bytes memory data = abi.encode(arr);
        // The ABI encoding of a dynamic array starts with an offset pointer.
        // Skip the 32-byte offset pointer to get to the actual array data.
        // Array data starts at: offset (32 bytes) -> length(32) + elements

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 32, conditions, 0
        );

        assertFalse(overflow);
        assertEq(locations.length, 3); // 3 elements
        // After the 32-byte length field, elements are at +0, +32, +64
        assertEq(locations[0], 64);  // 32 (offset to array data) + 32 (length field)
        assertEq(locations[1], 96);
        assertEq(locations[2], 128);
    }

    // =========================================================================
    // AbiEncoded -> Static (AE->S)
    // =========================================================================

    /// @dev AbiEncoded root (like function calldata) with static children.
    function test_abiEncodedToStatic() public view {
        // Condition tree: Matches(AbiEncoded) -> [Pass(Static), Pass(Static)]
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

        // Simulate calldata: fn(uint256,uint256) with selector stripped
        // AbiEncoded data starts at offset 0 relative to the data
        bytes memory data = abi.encode(uint256(100), uint256(200));

        (uint256[] memory locations, bool overflow) = locator.getChildLocations(
            data, 0, conditions, 0
        );

        assertFalse(overflow);
        assertEq(locations.length, 2);
        assertEq(locations[0], 0);
        assertEq(locations[1], 32);
    }
}
