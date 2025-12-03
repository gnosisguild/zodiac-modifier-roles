// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./core/Authorization.sol";
import "./core/Membership.sol";
import "./core/Setup.sol";
import "./core/allowance/ConsumptionTracker.sol";

/**
 * @title Zodiac Roles Mod - granular, role-based access control and policy
 *        engine for onchain accounts
 *
 * @author gnosisguild
 *
 */
contract Roles is
    RolesStorage,
    Setup,
    Membership,
    Authorization,
    ConsumptionTracker
{
    /// @param _owner Address of the owner
    /// @param _avatar Address of the avatar (e.g. a Gnosis Safe)
    /// @param _target Address of the contract that will call exec function
    constructor(address _owner, address _avatar, address _target) {
        bytes memory initParams = abi.encode(_owner, _avatar, _target);
        setUp(initParams);
    }

    /// @dev Passes a transaction to the modifier.
    /// @param to Destination address of module transaction
    /// @param value Ether value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @notice Can only be called by enabled modules
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) public override returns (bool success) {
        (
            address sender,
            bytes32 roleKey,
            uint192 nextMembership
        ) = _authenticate(0);

        Consumption[] memory consumptions = _authorize(
            roleKey,
            to,
            value,
            data,
            operation
        );
        _flushPrepare(consumptions);
        success = exec(to, value, data, operation);
        _flushCommit(consumptions, success);
        if (success && nextMembership != type(uint192).max) {
            _storeMembership(sender, roleKey, nextMembership);
        }
    }

    /// @dev Passes a transaction to the modifier, expects return data.
    /// @param to Destination address of module transaction
    /// @param value Ether value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @notice Can only be called by enabled modules
    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) public override returns (bool success, bytes memory returnData) {
        (
            address sender,
            bytes32 roleKey,
            uint192 nextMembership
        ) = _authenticate(0);
        Consumption[] memory consumptions = _authorize(
            roleKey,
            to,
            value,
            data,
            operation
        );
        _flushPrepare(consumptions);
        (success, returnData) = execAndReturnData(to, value, data, operation);
        _flushCommit(consumptions, success);
        if (success && nextMembership != type(uint192).max) {
            _storeMembership(sender, roleKey, nextMembership);
        }
    }

    /// @dev Passes a transaction to the modifier assuming the specified role.
    /// @param to Destination address of module transaction
    /// @param value Ether value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @param roleKey Identifier of the role to assume for this transaction
    /// @param shouldRevert Should the function revert on inner execution returning success false?
    /// @notice Can only be called by enabled modules
    function execTransactionWithRole(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        bytes32 roleKey,
        bool shouldRevert
    ) public returns (bool success) {
        (address sender, , uint192 nextMembership) = _authenticate(roleKey);
        Consumption[] memory consumptions = _authorize(
            roleKey,
            to,
            value,
            data,
            operation
        );
        _flushPrepare(consumptions);
        success = exec(to, value, data, operation);
        if (shouldRevert && !success) {
            revert ModuleTransactionFailed();
        }
        _flushCommit(consumptions, success);
        if (success && nextMembership != type(uint192).max) {
            _storeMembership(sender, roleKey, nextMembership);
        }
    }

    /// @dev Passes a transaction to the modifier assuming the specified role. Expects return data.
    /// @param to Destination address of module transaction
    /// @param value Ether value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @param roleKey Identifier of the role to assume for this transaction
    /// @param shouldRevert Should the function revert on inner execution returning success false?
    /// @notice Can only be called by enabled modules
    function execTransactionWithRoleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        bytes32 roleKey,
        bool shouldRevert
    ) public returns (bool success, bytes memory returnData) {
        (address sender, , uint192 nextMembership) = _authenticate(roleKey);
        Consumption[] memory consumptions = _authorize(
            roleKey,
            to,
            value,
            data,
            operation
        );
        _flushPrepare(consumptions);
        (success, returnData) = execAndReturnData(to, value, data, operation);
        if (shouldRevert && !success) {
            revert ModuleTransactionFailed();
        }
        _flushCommit(consumptions, success);
        if (success && nextMembership != type(uint192).max) {
            _storeMembership(sender, roleKey, nextMembership);
        }
    }
}
