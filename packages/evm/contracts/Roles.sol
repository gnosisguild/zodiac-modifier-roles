// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./AllowanceTracker.sol";
import "./PermissionBuilder.sol";
import "./PermissionChecker.sol";
import "./PermissionLoader.sol";

/**
 * @title Zodiac Roles Mod - granular, role-based, access control for your
 * on-chain avatar accounts (like Safe).
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 * @author Auryn Macmillan    - <auryn.macmillan@gnosis.io>
 * @author Nathan Ginnever    - <nathan.ginnever@gnosis.io>
 */
contract Roles is
    Modifier,
    AllowanceTracker,
    PermissionBuilder,
    PermissionChecker,
    PermissionLoader
{
    mapping(address => bytes32) public defaultRoles;

    event AssignRoles(address module, bytes32[] roleKeys, bool[] memberOf);
    event RolesModSetup(
        address indexed initiator,
        address indexed owner,
        address indexed avatar,
        address target
    );
    event SetDefaultRole(address module, bytes32 defaultRoleKey);

    error ArraysDifferentLength();

    /// Sender is allowed to make this call, but the internal transaction failed
    error ModuleTransactionFailed();

    /// @param _owner Address of the owner
    /// @param _avatar Address of the avatar (e.g. a Gnosis Safe)
    /// @param _target Address of the contract that will call exec function
    constructor(address _owner, address _avatar, address _target) {
        bytes memory initParams = abi.encode(_owner, _avatar, _target);
        setUp(initParams);
    }

    /// @dev There is no zero address check as solidty will check for
    /// missing arguments and the space of invalid addresses is too large
    /// to check. Invalid avatar or target address can be reset by owner.
    function setUp(bytes memory initParams) public override initializer {
        (address _owner, address _avatar, address _target) = abi.decode(
            initParams,
            (address, address, address)
        );
        _transferOwnership(_owner);
        avatar = _avatar;
        target = _target;

        setupModules();

        emit RolesModSetup(msg.sender, _owner, _avatar, _target);
    }

    /// @dev Assigns and revokes roles to a given module.
    /// @param module Module on which to assign/revoke roles.
    /// @param roleKeys Roles to assign/revoke.
    /// @param memberOf Assign (true) or revoke (false) corresponding roleKeys.
    function assignRoles(
        address module,
        bytes32[] calldata roleKeys,
        bool[] calldata memberOf
    ) external onlyOwner {
        if (roleKeys.length != memberOf.length) {
            revert ArraysDifferentLength();
        }
        for (uint16 i; i < roleKeys.length; ++i) {
            roles[roleKeys[i]].members[module] = memberOf[i];
        }
        if (!isModuleEnabled(module)) {
            enableModule(module);
        }
        emit AssignRoles(module, roleKeys, memberOf);
    }

    /// @dev Sets the default role used for a module if it calls execTransactionFromModule() or execTransactionFromModuleReturnData().
    /// @param module Address of the module on which to set default role.
    /// @param roleKey Role to be set as default.
    function setDefaultRole(
        address module,
        bytes32 roleKey
    ) external onlyOwner {
        defaultRoles[module] = roleKey;
        emit SetDefaultRole(module, roleKey);
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
        Consumption[] memory consumptions = _authorize(
            defaultRoles[msg.sender],
            to,
            value,
            data,
            operation
        );
        _flushPrepare(consumptions);
        success = exec(to, value, data, operation);
        _flushCommit(consumptions, success);
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
        Consumption[] memory consumptions = _authorize(
            defaultRoles[msg.sender],
            to,
            value,
            data,
            operation
        );
        _flushPrepare(consumptions);
        (success, returnData) = execAndReturnData(to, value, data, operation);
        _flushCommit(consumptions, success);
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
    }
}
