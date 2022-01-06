// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "./Comp.sol";
import "./Permissions.sol";
import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
    mapping(address => uint16) public defaultRoles;
    mapping(uint16 => Role) roles;

    address public multiSend;

    event AssignRoles(address module, uint16[] roles);
    event SetMulitSendAddress(address multiSendAddress);

    event SetCanDelegateToTarget(
        uint16 role,
        address targetAddress,
        bool enabled
    );
    event SetCanSendToTarget(uint16 role, address targetAddress, bool enabled);

    event AllowTarget(uint16 role, address targetAddress, bool allow);
    event AllowFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        bool allow
    );
    event ScopeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool[] paramIsScoped,
        bool[] paramIsDynamic,
        Comp.Comparison[] paramCompType
    );
    event ScopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isScoped,
        bool isDynamic,
        Comp.Comparison compType
    );

    event SetParameterAllowedValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bytes value,
        bool allowed
    );
    event SetParameterCompValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bytes compValue
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

    /// @dev Set whether or not delegate calls can be made to a target address.
    /// @notice Only callable by owner.
    /// @notice Is not an allowance. Depends on call having require clearance. Transversal.
    /// @param role Role to set for
    /// @param targetAddress Address to which delegate calls should be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) delegate calls to target address.
    function setCanDelegateToTarget(
        uint16 role,
        address targetAddress,
        bool allow
    ) external onlyOwner {
        roles[role].targets[targetAddress].canDelegate = allow;
        emit SetCanDelegateToTarget(role, targetAddress, allow);
    }

    /// @dev Sets whether or not a target address can be sent to (incluces fallback/receive functions).
    /// @notice Only callable by owner.
    /// @notice Is not an allowance. Depends on call having require clearance. Transversal.
    /// @param role Role to set for
    /// @param targetAddress Address to be allow/disallow sends to.
    /// @param allow Bool to allow (true) or disallow (false) sends on target address.
    function setCanSendToTarget(
        uint16 role,
        address targetAddress,
        bool allow
    ) external onlyOwner {
        roles[role].targets[targetAddress].canSend = allow;
        emit SetCanSendToTarget(role, targetAddress, allow);
    }

    /// @dev Allows all calls made to an address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) call to an address.
    function allowTarget(
        uint16 role,
        address targetAddress,
        bool allow
    ) external onlyOwner {
        roles[role].targets[targetAddress].clearance = allow
            ? Clearance.TARGET
            : Clearance.NONE;

        emit AllowTarget(role, targetAddress, allow);
    }

    /// @dev Allows a specific function on a target address to be called.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Scoped address on which a function signature should be allowed/disallowed.
    /// @param functionSig Function signature to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) call to a function on an address.
    function allowFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool allow
    ) external onlyOwner {
        if (allow) {
            roles[role].targets[targetAddress].clearance = Clearance.FUNCTION;
        }

        roles[role].functions[
            Permissions.keyForFunctions(targetAddress, functionSig)
        ] = allow ? Permissions.FUNCTION_WHITELIST : 0;
        emit AllowFunction(role, targetAddress, functionSig, allow);
    }

    /// @dev Sets and enforces scoping for a function on an address
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
        bool[] memory isParamScoped,
        bool[] memory isParamDynamic,
        Comp.Comparison[] memory paramCompType
    ) external onlyOwner {
        // 24kb
        // require(
        //     isParamScoped.length == isParamDynamic.length,
        //     "Mismatch: isParamScoped and isParamDynamic length"
        // );

        // require(
        //     isParamScoped.length == paramCompType.length,
        //     "Mismatch: isParamScoped and paramCompType length"
        // );

        require(
            isParamScoped.length == isParamDynamic.length &&
                isParamScoped.length == paramCompType.length,
            "Len - Mismatch"
        );

        uint256 paramConfig = Permissions.resetParamConfig(
            isParamScoped,
            isParamDynamic,
            paramCompType
        );

        roles[role].functions[
            Permissions.keyForFunctions(targetAddress, functionSig)
        ] = paramConfig;

        emit ScopeFunction(
            role,
            targetAddress,
            functionSig,
            isParamScoped,
            isParamDynamic,
            paramCompType
        );
    }

    /// @dev Sets and enforces scoping for a single paramater in a function on an address
    /// @notice Only callable by owner.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param paramIndex the index of the parameter to scope
    /// @param isScoped false for un-scoped, true for scoped.
    /// @param isDynamic false for value, true for dynamic.
    /// @param compType Any, or EqualTo, GreaterThan, or LessThan compValue.
    function scopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isScoped,
        bool isDynamic,
        Comp.Comparison compType
    ) external onlyOwner {
        bytes32 key = Permissions.keyForFunctions(targetAddress, functionSig);
        uint256 prevParamConfig = roles[role].functions[key];
        uint256 nextParamConfig = Permissions.setParamConfig(
            prevParamConfig,
            paramIndex,
            isScoped,
            isDynamic,
            compType
        );
        roles[role].functions[key] = nextParamConfig;

        emit ScopeParameter(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            isScoped,
            isDynamic,
            compType
        );
    }

    /// @dev Sets whether or not a specific parameter value is allowed for a function call.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature
    /// @param paramIndex index of the parameter to scope
    /// @param value the parameter value to be set
    /// @param allow allow (true) or disallow (false) parameter value
    function setParameterAllowedValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bytes memory value,
        bool allow
    ) external onlyOwner {
        bytes32 key = Permissions.keyForCompValues(
            targetAddress,
            functionSig,
            paramIndex
        );

        roles[role].compValues[key].allowed[
            value.length > 32 ? keccak256(value) : bytes32(value)
        ] = allow;

        emit SetParameterAllowedValue(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            value,
            allow
        );
    }

    /// @dev Sets the comparison value for a parameter
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to set for.
    /// @param functionSig first 4 bytes of the sha256 of the function signature
    /// @param paramIndex index of the parameter to scope
    /// @param compValue the comparison value
    function setParameterCompValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bytes memory compValue
    ) external onlyOwner {
        bytes32 key = Permissions.keyForCompValues(
            targetAddress,
            functionSig,
            paramIndex
        );

        roles[role].compValues[key].compValue = compValue.length > 32
            ? keccak256(compValue)
            : bytes32(compValue);

        emit SetParameterCompValue(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            compValue
        );
    }

    /// @dev Assigns and revokes roles to a given module.
    /// @param module Module on which to assign/revoke roles.
    /// @param _roles Roles to assign/revoke.
    /// @param memberOf Assign (true) or revoke (false) corresponding _roles.
    function assignRoles(
        address module,
        uint16[] calldata _roles,
        bool[] memory memberOf
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
        return
            execTransactionWithRole(
                to,
                value,
                data,
                operation,
                defaultRoles[msg.sender]
            );
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
    )
        public
        override
        moduleOnly
        returns (bool success, bytes memory returnData)
    {
        return
            execTransactionWithRoleReturnData(
                to,
                value,
                data,
                operation,
                defaultRoles[msg.sender]
            );
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
    ) public moduleOnly returns (bool success) {
        Role storage _role = roles[role];

        if (!_role.members[msg.sender]) {
            revert NoMembership();
        }
        if (to == multiSend) {
            Permissions.checkMultisendTransaction(_role, data);
        } else {
            Permissions.checkTransaction(_role, to, value, data, operation);
        }
        if (!exec(to, value, data, operation)) {
            revert ModuleTransactionFailed();
        }
        return true;
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
    ) public moduleOnly returns (bool success, bytes memory returnData) {
        Role storage _role = roles[role];

        if (!_role.members[msg.sender]) {
            revert NoMembership();
        }
        if (to == multiSend) {
            Permissions.checkMultisendTransaction(_role, data);
        } else {
            Permissions.checkTransaction(_role, to, value, data, operation);
        }
        return execAndReturnData(to, value, data, operation);
    }
}
