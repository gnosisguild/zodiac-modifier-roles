// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../Base.t.sol";

/// @title Condition Tree Integrity Tests
/// @notice Verifies that the integrity validation correctly rejects
///         malformed condition trees.
contract IntegrityTest is BaseTest {

    // =========================================================================
    // Unsuitable Root Node
    // =========================================================================

    /// @dev Empty conditions array returns empty bytes from packConditions.
    ///      Integrity.enforce reverts when called directly with empty array.
    function test_revertsUnsuitableRootNode_empty() public {
        // packConditions short-circuits for empty arrays, so we test with
        // a single node whose parent is nonzero (making it an invalid root).
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 1, // nonzero parent = not a valid root
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.expectRevert(IRolesError.UnsuitableRootNode.selector);
        roles.packConditions(conditions);
    }

    /// @dev Root node with parent pointing to itself should revert.
    function test_revertsUnsuitableRootNode_selfParent() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        // Root is fine
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        // Second node points to itself as parent
        conditions[1] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.expectRevert(IRolesError.UnsuitableRootNode.selector);
        roles.packConditions(conditions);
    }

    /// @dev Root node with nonzero parent should revert.
    function test_revertsUnsuitableRootNode_nonzeroParent() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.expectRevert(IRolesError.UnsuitableRootNode.selector);
        roles.packConditions(conditions);
    }

    // =========================================================================
    // Not BFS Order
    // =========================================================================

    /// @dev Parent indices must be non-decreasing in BFS order.
    function test_revertsNotBFS_parentOutOfOrder() public {
        // Create a tree where parent indices go backwards
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
        // This node has parent=0, but previous node has parent=0 too, then next goes to parent 2
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        // Goes back to parent 0 - violates BFS order (parent < previous parent)
        conditions[3] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.expectRevert(IRolesError.NotBFS.selector);
        roles.packConditions(conditions);
    }

    // =========================================================================
    // Unsuitable Child Count
    // =========================================================================

    /// @dev And/Or nodes must have at least one child.
    function test_revertsUnsuitableChildCount_logicNodeNoChildren() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: ""
        });

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableChildCount.selector, 0));
        roles.packConditions(conditions);
    }

    /// @dev Tuple must have at least one structural child.
    function test_revertsUnsuitableChildCount_tupleNoChildren() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](1);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableChildCount.selector, 0));
        roles.packConditions(conditions);
    }

    // =========================================================================
    // Leaf Node Cannot Have Children
    // =========================================================================

    /// @dev Static leaf nodes cannot have children.
    function test_revertsLeafNodeCannotHaveChildren() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        // A static Pass node
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        // Tries to be a child of the static node
        conditions[2] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.expectRevert(abi.encodeWithSelector(IRolesError.LeafNodeCannotHaveChildren.selector, 1));
        roles.packConditions(conditions);
    }

    /// @dev Empty operator cannot have children.
    function test_revertsLeafNodeCannotHaveChildren_emptyWithChild() public {
        ConditionFlat[] memory conditions = new ConditionFlat[](2);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Empty,
            compValue: ""
        });
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.expectRevert(abi.encodeWithSelector(IRolesError.LeafNodeCannotHaveChildren.selector, 0));
        roles.packConditions(conditions);
    }

    // =========================================================================
    // Unsuitable Child Type Tree
    // =========================================================================

    /// @dev And/Or children must have compatible type trees.
    ///      Tuple children with different numbers of fields are incompatible.
    function test_revertsUnsuitableChildTypeTree() public {
        // Or node with two Tuple children of incompatible structure:
        // one child is Tuple(Static), other is Tuple(Static, Static)
        // (Tuples are not "dynamicish", so hash mismatch triggers the error.)
        ConditionFlat[] memory conditions = new ConditionFlat[](6);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: ""
        });
        // First child: Matches(Tuple) with 1 static child
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });
        // Second child: Matches(Tuple) with 2 static children
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Tuple,
            operator: Operator.Matches,
            compValue: ""
        });
        // First child's static child
        conditions[3] = ConditionFlat({
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        // Second child's first static child
        conditions[4] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });
        // Second child's second static child
        conditions[5] = ConditionFlat({
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        vm.expectRevert(abi.encodeWithSelector(IRolesError.UnsuitableChildTypeTree.selector, 0));
        roles.packConditions(conditions);
    }
}
