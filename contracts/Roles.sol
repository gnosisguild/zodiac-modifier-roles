// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Permissions.sol";

contract Roles is Modifier {
    address public multiSend;

    mapping(address => uint16) defaultRoles;
    mapping(uint16 => Role) roles;

    event AssignRoles(address module, uint16[] roles);
    event SetMulitSendAddress(address multiSendAddress);

    event AllowTarget(
        uint16 role,
        address targetAddress,
        bool canSend,
        bool canDelegate
    );
    event AllowTargetPartially(
        uint16 role,
        address targetAddress,
        bool canSend,
        bool canDelegate
    );
    event RevokeTarget(uint16 role, address targetAddress);

    event ScopeAllowFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector
    );
    event ScopeRevokeFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector
    );
    event ScopeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool[] paramIsScoped,
        bool[] paramIsDynamic,
        Comparison[] paramCompType,
        bytes[] paramCompValue
    );

    event ScopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isDynamic,
        Comparison compType,
        bytes compValue
    );
    event ScopeParameterAsOneOf(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isDynamic,
        bytes[] compValues
    );
    event UnscopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex
    );

    event RolesModSetup(
        address indexed initiator,
        address indexed owner,
        address indexed avatar,
        address target
    );
    event SetDefaultRole(address module, uint16 defaultRole);

    /// `setUpModules` has already been called
    error SetUpModulesAlreadyCalled();

    /// Arrays must be the same length
    error ArraysDifferentLength();

    /// Sender is not a member of the role
    error NoMembership();

    /// Sender is allowed to make this call, but the internal transaction failed
    error ModuleTransactionFailed();

    /// @param _owner Address of the owner
    /// @param _avatar Address of the avatar (e.g. a Gnosis Safe)
    /// @param _target Address of the contract that will call exec function
    constructor(
        address _owner,
        address _avatar,
        address _target
    ) {
        bytes memory initParams = abi.encode(_owner, _avatar, _target);
        setUp(initParams);
    }

    function setUp(bytes memory initParams) public override {
        (address _owner, address _avatar, address _target) = abi.decode(
            initParams,
            (address, address, address)
        );
        __Ownable_init();

        avatar = _avatar;
        target = _target;

        transferOwnership(_owner);
        setupModules();

        emit RolesModSetup(msg.sender, _owner, _avatar, _target);
    }

    function setupModules() internal {
        if (modules[SENTINEL_MODULES] != address(0)) {
            revert SetUpModulesAlreadyCalled();
        }
        modules[SENTINEL_MODULES] = SENTINEL_MODULES;
    }

    /// @dev Set the address of the expected multisend library
    /// @notice Only callable by owner.
    /// @param _multiSend address of the multisend library contract
    function setMultiSend(address _multiSend) external onlyOwner {
        multiSend = _multiSend;
        emit SetMulitSendAddress(multiSend);
    }

    /// @dev Allows all calls made to an address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param canSend allows/disallows whether or not a target address can be sent to (incluces fallback/receive functions).
    /// @param canDelegate allows/disallows whether or not delegate calls can be made to a target address.
    function allowTarget(
        uint16 role,
        address targetAddress,
        bool canSend,
        bool canDelegate
    ) external onlyOwner {
        roles[role].targets[targetAddress] = TargetAddress(
            Clearance.TARGET,
            canSend,
            canDelegate
        );
        emit AllowTarget(role, targetAddress, canSend, canDelegate);
    }

    /// @dev Partially allows calls to a Target - subject to function scoping rules.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be allowed
    /// @param canSend allows/disallows whether or not a target address can be sent to (incluces fallback/receive functions).
    /// @param canDelegate allows/disallows whether or not delegate calls can be made to a target address.
    function allowTargetPartially(
        uint16 role,
        address targetAddress,
        bool canSend,
        bool canDelegate
    ) external onlyOwner {
        roles[role].targets[targetAddress] = TargetAddress(
            Clearance.FUNCTION,
            canSend,
            canDelegate
        );
        emit AllowTargetPartially(role, targetAddress, canSend, canDelegate);
    }

    /// @dev Disallows all calls made to an address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be disallowed
    function revokeTarget(uint16 role, address targetAddress)
        external
        onlyOwner
    {
        roles[role].targets[targetAddress] = TargetAddress(
            Clearance.NONE,
            false,
            false
        );
        emit RevokeTarget(role, targetAddress);
    }

    /// @dev Allows a specific function, on a specific address, to be called.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Scoped address on which a function signature should be allowed/disallowed.
    /// @param functionSig Function signature to be allowed/disallowed.
    function scopeAllowFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig
    ) external onlyOwner {
        Permissions.scopeAllowFunction(roles[role], targetAddress, functionSig);
        emit ScopeAllowFunction(role, targetAddress, functionSig);
    }

    /// @dev Disallows a specific function, on a specific address from being called.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Scoped address on which a function signature should be allowed/disallowed.
    /// @param functionSig Function signature to be allowed/disallowed.
    function scopeRevokeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig
    ) external onlyOwner {
        Permissions.scopeRevokeFunction(
            roles[role],
            targetAddress,
            functionSig
        );
        emit ScopeRevokeFunction(role, targetAddress, functionSig);
    }

    /// @dev Sets and enforces scoping for an allowed function, on a specific address
    /// @notice Only callable by owner.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param isParamScoped false for un-scoped, true for scoped.
    /// @param isParamDynamic false for static, true for dynamic.
    /// @param paramCompType Any, or EqualTo, GreaterThan, or LessThan compValue.
    function scopeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool[] calldata isParamScoped,
        bool[] calldata isParamDynamic,
        Comparison[] calldata paramCompType,
        bytes[] calldata paramCompValue
    ) external onlyOwner {
        Permissions.scopeFunction(
            roles[role],
            targetAddress,
            functionSig,
            isParamScoped,
            isParamDynamic,
            paramCompType,
            paramCompValue
        );
        emit ScopeFunction(
            role,
            targetAddress,
            functionSig,
            isParamScoped,
            isParamDynamic,
            paramCompType,
            paramCompValue
        );
    }

    /// @dev Sets and enforces scoping for a single parameter on an allowed function
    /// @notice Only callable by owner.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param paramIndex the index of the parameter to scope
    /// @param isDynamic false for value, true for dynamic.
    /// @param compType Any, or EqualTo, GreaterThan, or LessThan compValue.
    /// @param compValue The reference value used while comparing and authorizing
    function scopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isDynamic,
        Comparison compType,
        bytes calldata compValue
    ) external onlyOwner {
        Permissions.scopeParameter(
            roles[role],
            targetAddress,
            functionSig,
            paramIndex,
            isDynamic,
            compType,
            compValue
        );
        emit ScopeParameter(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            isDynamic,
            compType,
            compValue
        );
    }

    /// @dev Sets and enforces scoping of type OneOf for a single parameter on an allowed function
    /// @notice Only callable by owner.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param paramIndex the index of the parameter to scope
    /// @param isDynamic false for value, true for dynamic.
    /// @param compValues The reference values used while comparing and authorizing
    function scopeParameterAsOneOf(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isDynamic,
        bytes[] calldata compValues
    ) external onlyOwner {
        Permissions.scopeParameterAsOneOf(
            roles[role],
            targetAddress,
            functionSig,
            paramIndex,
            isDynamic,
            compValues
        );
        emit ScopeParameterAsOneOf(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            isDynamic,
            compValues
        );
    }

    /// @dev Unsets scoping for a single parameter on an allowed function
    /// @notice Only callable by owner.
    /// @notice If no parameter remains scoped after this call, access to the function is revoked.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param paramIndex the index of the parameter to scope
    function unscopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex
    ) external onlyOwner {
        Permissions.unscopeParameter(
            roles[role],
            targetAddress,
            functionSig,
            paramIndex
        );
        emit UnscopeParameter(role, targetAddress, functionSig, paramIndex);
    }

    /// @dev Assigns and revokes roles to a given module.
    /// @param module Module on which to assign/revoke roles.
    /// @param _roles Roles to assign/revoke.
    /// @param memberOf Assign (true) or revoke (false) corresponding _roles.
    function assignRoles(
        address module,
        uint16[] calldata _roles,
        bool[] calldata memberOf
    ) external onlyOwner {
        if (_roles.length != memberOf.length) {
            revert ArraysDifferentLength();
        }
        for (uint16 i = 0; i < _roles.length; i++) {
            roles[_roles[i]].members[module] = memberOf[i];
        }
        if (!isModuleEnabled(module)) {
            enableModule(module);
        }
        emit AssignRoles(module, _roles);
    }

    /// @dev Sets the default role used for a module if it calls execTransactionFromModule() or execTransactionFromModuleReturnData().
    /// @param module Address of the module on which to set default role.
    /// @param role Role to be set as default.
    function setDefaultRole(address module, uint16 role) external onlyOwner {
        defaultRoles[module] = role;
        emit SetDefaultRole(module, role);
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
        Enum.Operation operation
    ) public override moduleOnly returns (bool success) {
        _checkRolePermissions(
            to,
            value,
            data,
            operation,
            defaultRoles[msg.sender]
        );
        return exec(to, value, data, operation);
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
        Enum.Operation operation
    ) public override moduleOnly returns (bool, bytes memory) {
        _checkRolePermissions(
            to,
            value,
            data,
            operation,
            defaultRoles[msg.sender]
        );
        return execAndReturnData(to, value, data, operation);
    }

    /// @dev Passes a transaction to the modifier assuming the specified role. Reverts if the passed transaction fails.
    /// @param to Destination address of module transaction
    /// @param value Ether value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @param role Identifier of the role to assume for this transaction.
    /// @notice Can only be called by enabled modules
    function execTransactionWithRole(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint16 role
    ) public moduleOnly {
        _checkRolePermissions(to, value, data, operation, role);
        if (!exec(to, value, data, operation)) {
            revert ModuleTransactionFailed();
        }
    }

    /// @dev Passes a transaction to the modifier assuming the specified role. expects return data.
    /// @param to Destination address of module transaction
    /// @param value Ether value of module transaction
    /// @param data Data payload of module transaction
    /// @param operation Operation type of module transaction
    /// @param role Identifier of the role to assume for this transaction.
    /// @notice Can only be called by enabled modules
    function execTransactionWithRoleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint16 role
    ) public moduleOnly returns (bytes memory returnData) {
        _checkRolePermissions(to, value, data, operation, role);
        bool success;
        (success, returnData) = execAndReturnData(to, value, data, operation);
        if (!success) {
            revert ModuleTransactionFailed();
        }
    }

    function _checkRolePermissions(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint16 role
    ) internal view {
        Role storage _role = roles[role];

        if (!_role.members[msg.sender]) {
            revert NoMembership();
        }
        if (to == multiSend) {
            Permissions.checkMultisendTransaction(_role, data);
        } else {
            Permissions.checkTransaction(_role, to, value, data, operation);
        }
    }
}
