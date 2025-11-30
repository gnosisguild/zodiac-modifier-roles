// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {AuthorizationStatus} from "./Authorization.sol";

/**
 * @title IRolesError - All custom errors emitted by the Roles Mod
 *
 * @author gnosisguild
 */
interface IRolesError {
    /*//////////////////////////////////////////////////////////////
                            EXECUTION ERRORS
    //////////////////////////////////////////////////////////////*/

    /// Arrays provided have different lengths
    error ArraysDifferentLength();

    /// Sender is allowed to make this call, but the internal transaction failed
    error ModuleTransactionFailed();

    /*//////////////////////////////////////////////////////////////
                          AUTHORIZATION ERRORS
    //////////////////////////////////////////////////////////////*/

    /// Sender is not a member of the role
    error NoMembership();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Calldata unwrapping failed
    error MalformedMultiEntrypoint();

    /// Authorization check failed with specified status and info
    error ConditionViolation(AuthorizationStatus status, bytes32 info);

    /*//////////////////////////////////////////////////////////////
                            DECODING ERRORS
    //////////////////////////////////////////////////////////////*/

    /// Attempted to read beyond calldata bounds
    error CalldataOutOfBounds();

    /*//////////////////////////////////////////////////////////////
                           INTEGRITY ERRORS
    //////////////////////////////////////////////////////////////*/

    /// Root node is invalid or missing
    error UnsuitableRootNode();

    /// Condition tree is not in BFS (breadth-first search) order
    error NotBFS();

    /// Parameter type is unsuitable for the operator at given index
    error UnsuitableParameterType(uint256 index);

    /// Comparison value is unsuitable for the operator at given index
    error UnsuitableCompValue(uint256 index);

    /// Operator is not supported at given index
    error UnsupportedOperator(uint256 index);

    /// Parent node is unsuitable for the child at given index
    error UnsuitableParent(uint256 index);

    /// Child count is unsuitable for the node at given index
    error UnsuitableChildCount(uint256 index);

    /// Child type tree is unsuitable for the node at given index
    error UnsuitableChildTypeTree(uint256 index);

    /// Non-structural children must appear after all structural children
    error NonStructuralChildrenMustComeLast(uint256 index);

    /// WithinRatio target must resolve to a Static type
    error WithinRatioTargetNotStatic(uint256 index);

    /// WithinRatio requires at least one ratio (min or max) to be provided
    error WithinRatioNoRatioProvided(uint256 index);
}
