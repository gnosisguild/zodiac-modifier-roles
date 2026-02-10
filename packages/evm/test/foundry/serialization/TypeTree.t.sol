// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../../contracts/__test__/mocks/MockTypeTree.sol";
import "../../../contracts/types/Types.sol";

/// @title Type Tree Tests
/// @notice Verifies type tree computation: layout inspection, collapsing of
///         And/Or nodes, inlining of static types, and hash properties.
contract TypeTreeTest is Test {
    MockTypeTree internal typeTree;

    function setUp() public {
        typeTree = new MockTypeTree();
    }

    // =========================================================================
    // Leaf Static Layout
    // =========================================================================

    /// @dev A single static leaf should produce a layout with Static encoding.
    function test_leafStaticLayout() public view {
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

        MockTypeTree.FlatLayoutForTest[] memory result = typeTree.inspect(conditions);

        // Root + 1 child = 2 entries
        assertEq(result.length, 2);
        // Root is AbiEncoded
        assertEq(uint8(result[0].encoding), uint8(Encoding.AbiEncoded));
        // Child is Static
        assertEq(uint8(result[1].encoding), uint8(Encoding.Static));
    }

    // =========================================================================
    // Collapses And Node
    // =========================================================================

    /// @dev An And node with structural children should collapse to the
    ///      child's type tree.
    function test_collapsesAndNode() public view {
        // And -> [Matches(AbiEncoded) -> [Static.Pass]]
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
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
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        MockTypeTree.FlatLayoutForTest[] memory result = typeTree.inspect(conditions);

        // The And node should collapse to its child's layout
        // Result should contain the AbiEncoded root and its Static child
        assertTrue(result.length >= 2);
        // The resolved layout should contain AbiEncoded at root level
        assertEq(uint8(result[0].encoding), uint8(Encoding.AbiEncoded));
    }

    // =========================================================================
    // Collapses Or Node
    // =========================================================================

    /// @dev An Or node with compatible structural children should collapse.
    function test_collapsesOrNode() public view {
        // Or -> [Matches(AbiEncoded) -> [Static.EqualTo], Matches(AbiEncoded) -> [Static.EqualTo]]
        ConditionFlat[] memory conditions = new ConditionFlat[](5);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
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
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(1))
        });
        conditions[4] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: abi.encode(uint256(2))
        });

        MockTypeTree.FlatLayoutForTest[] memory result = typeTree.inspect(conditions);

        // The Or node should collapse to one of its children's layout
        assertTrue(result.length >= 2);
        assertEq(uint8(result[0].encoding), uint8(Encoding.AbiEncoded));
    }

    // =========================================================================
    // Marks Static As Inlined
    // =========================================================================

    /// @dev Static nodes within tuples should be marked as inlined.
    function test_marksStaticAsInlined() public view {
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

        MockTypeTree.FlatLayoutForTest[] memory result = typeTree.inspect(conditions);

        assertEq(result.length, 3);
        // Static children of a tuple should be inlined
        assertTrue(result[1].inlined, "static child 1 should be inlined");
        assertTrue(result[2].inlined, "static child 2 should be inlined");
    }

    // =========================================================================
    // Hash Basic Properties
    // =========================================================================

    /// @dev Same condition trees should produce the same hash.
    function test_hashBasicProperties() public view {
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

        bytes32 hash1 = typeTree.hash(conditions);
        bytes32 hash2 = typeTree.hash(conditions);

        assertEq(hash1, hash2, "same tree should produce same hash");
        assertTrue(hash1 != bytes32(0), "hash should not be zero");
    }

    // =========================================================================
    // Hash Sensitive to Child Order
    // =========================================================================

    /// @dev Different child orderings (Static,Dynamic) vs (Dynamic,Static)
    ///      should produce different hashes.
    function test_hashSensitiveToChildOrder() public view {
        // Tree A: AbiEncoded -> [Static, Dynamic]
        ConditionFlat[] memory conditionsA = new ConditionFlat[](3);
        conditionsA[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditionsA[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        conditionsA[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: ""
        });

        // Tree B: AbiEncoded -> [Dynamic, Static]
        ConditionFlat[] memory conditionsB = new ConditionFlat[](3);
        conditionsB[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        conditionsB[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Dynamic,
            operator: Operator.Pass,
            compValue: ""
        });
        conditionsB[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        bytes32 hashA = typeTree.hash(conditionsA);
        bytes32 hashB = typeTree.hash(conditionsB);

        assertTrue(hashA != hashB, "different child order should produce different hashes");
    }
}
