// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Modifier.sol";

/**
 * @title TRON Roles Modifier - Simplified role-based access control for TRON Safe
 * @author Ported for TRON network
 * @notice This is a simplified version of the Zodiac Roles modifier adapted for TRON
 */
contract TRONRoles is Modifier {
    // Role management
    mapping(address => bytes32) public defaultRoles;
    mapping(bytes32 => mapping(address => bool)) public roles;
    mapping(bytes32 => mapping(address => bool)) public targets;
    
    // Events
    event AssignRoles(address module, bytes32[] roleKeys, bool[] memberOf);
    event RolesModSetup(
        address indexed initiator,
        address indexed owner,
        address indexed avatar,
        address target
    );
    event SetDefaultRole(address module, bytes32 defaultRoleKey);
    event SetTarget(address target, bytes32 roleKey, bool allowed);

    error ArraysDifferentLength();
    error ModuleTransactionFailed();

    /// @param _owner Address of the owner
    /// @param _avatar Address of the avatar (e.g. a TRON Safe)
    /// @param _target Address of the contract that will call exec function
    constructor(address _owner, address _avatar, address _target) {
        bytes memory initParams = abi.encode(_owner, _avatar, _target);
        setUp(initParams);
    }

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
            roles[roleKeys[i]][module] = memberOf[i];
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

    /// @dev Sets whether a target address is allowed for a specific role.
    /// @param targetAddress Address to allow/deny.
    /// @param roleKey Role for which to set the target.
    /// @param allowed Whether the target is allowed for this role.
    function setTarget(
        address targetAddress,
        bytes32 roleKey,
        bool allowed
    ) external onlyOwner {
        targets[roleKey][targetAddress] = allowed;
        emit SetTarget(targetAddress, roleKey, allowed);
    }

    /// @dev Passes a transaction to the modifier.
    /// @param to Destination address of module transaction
    /// @param value TRX value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @notice Can only be called by enabled modules
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) public override returns (bool success) {
        bytes32 roleKey = defaultRoles[msg.sender];
        require(roles[roleKey][msg.sender], "Module not authorized for role");
        require(targets[roleKey][to], "Target not allowed for role");
        
        success = exec(to, value, data, operation);
        if (!success) {
            revert ModuleTransactionFailed();
        }
    }

    /// @dev Passes a transaction to the modifier, expects return data.
    /// @param to Destination address of module transaction
    /// @param value TRX value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @notice Can only be called by enabled modules
    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) public override returns (bool success, bytes memory returnData) {
        bytes32 roleKey = defaultRoles[msg.sender];
        require(roles[roleKey][msg.sender], "Module not authorized for role");
        require(targets[roleKey][to], "Target not allowed for role");
        
        (success, returnData) = execAndReturnData(to, value, data, operation);
        if (!success) {
            revert ModuleTransactionFailed();
        }
    }

    /// @dev Passes a transaction to the modifier assuming the specified role.
    /// @param to Destination address of module transaction
    /// @param value TRX value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @param roleKey Identifier of the role to assume for this transaction
    /// @notice Can only be called by enabled modules
    function execTransactionWithRole(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        bytes32 roleKey
    ) public returns (bool success) {
        require(roles[roleKey][msg.sender], "Module not authorized for role");
        require(targets[roleKey][to], "Target not allowed for role");
        
        success = exec(to, value, data, operation);
        if (!success) {
            revert ModuleTransactionFailed();
        }
    }

    /// @dev Passes a transaction to the modifier assuming the specified role. Expects return data.
    /// @param to Destination address of module transaction
    /// @param value TRX value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @param roleKey Identifier of the role to assume for this transaction
    /// @notice Can only be called by enabled modules
    function execTransactionWithRoleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        bytes32 roleKey
    ) public returns (bool success, bytes memory returnData) {
        require(roles[roleKey][msg.sender], "Module not authorized for role");
        require(targets[roleKey][to], "Target not allowed for role");
        
        (success, returnData) = execAndReturnData(to, value, data, operation);
        if (!success) {
            revert ModuleTransactionFailed();
        }
    }

    /// @dev Check if a module has a specific role
    /// @param module Module address to check
    /// @param roleKey Role to check
    /// @return Whether the module has the role
    function hasRole(address module, bytes32 roleKey) external view returns (bool) {
        return roles[roleKey][module];
    }

    /// @dev Check if a target is allowed for a specific role
    /// @param targetAddress Target address to check
    /// @param roleKey Role to check
    /// @return Whether the target is allowed for the role
    function isTargetAllowed(address targetAddress, bytes32 roleKey) external view returns (bool) {
        return targets[roleKey][targetAddress];
    }
}
