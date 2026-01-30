// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../../contracts/__test__/mocks/MockPackerUnpacker.sol";
import "../../../contracts/types/Types.sol";

/// @title Packer/Unpacker Roundtrip Tests
/// @notice Verifies that packing and unpacking conditions preserves all
///         relevant fields: operator, encoding, compValue, and tree structure.
contract PackerUnpackerTest is Test {
    MockPackerUnpacker internal packer;

    function setUp() public {
        packer = new MockPackerUnpacker();
    }

    // =========================================================================
    // Preserves Operator
    // =========================================================================

    function test_preservesOperator() public view {
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

        (MockPackerUnpacker.ConditionForTest[] memory result, ) = packer.roundtrip(conditions);

        assertEq(result.length, 2);
        assertEq(uint8(result[0].operator), uint8(Operator.Matches));
        assertEq(uint8(result[1].operator), uint8(Operator.EqualTo));
    }

    // =========================================================================
    // Preserves Encoding
    // =========================================================================

    function test_preservesEncoding() public view {
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

        (MockPackerUnpacker.ConditionForTest[] memory result, ) = packer.roundtrip(conditions);

        assertEq(result.length, 3);
        assertEq(uint8(result[0].encoding), uint8(Encoding.AbiEncoded));
        assertEq(uint8(result[1].encoding), uint8(Encoding.Static));
        assertEq(uint8(result[2].encoding), uint8(Encoding.Dynamic));
    }

    // =========================================================================
    // Preserves CompValue
    // =========================================================================

    function test_preservesCompValue() public view {
        bytes memory compValue = abi.encode(uint256(12345));

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
            compValue: compValue
        });

        (MockPackerUnpacker.ConditionForTest[] memory result, ) = packer.roundtrip(conditions);

        assertEq(result.length, 2);
        assertEq(result[1].compValue, compValue);
    }

    // =========================================================================
    // Preserves Tree Structure
    // =========================================================================

    function test_preservesTreeStructure() public view {
        // Build a tree: root(AbiEncoded.Matches) -> [Static.Pass, Tuple.Matches -> [Static.Pass, Static.Pass]]
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

        (MockPackerUnpacker.ConditionForTest[] memory result, ) = packer.roundtrip(conditions);

        assertEq(result.length, 5);

        // Verify BFS parent structure
        assertEq(result[0].parent, 0); // root
        assertEq(result[1].parent, 0); // child of root
        assertEq(result[2].parent, 0); // child of root
        assertEq(result[3].parent, 2); // child of tuple
        assertEq(result[4].parent, 2); // child of tuple
    }

    // =========================================================================
    // Computes Size Correctly
    // =========================================================================

    function test_computesSizeCorrectly() public view {
        // Static nodes should have size 32
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

        (MockPackerUnpacker.ConditionForTest[] memory result, ) = packer.roundtrip(conditions);

        assertEq(result.length, 2);
        // Static nodes should have size = 32
        assertEq(result[1].size, 32);
    }
}
