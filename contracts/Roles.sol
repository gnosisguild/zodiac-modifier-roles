// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "./Comp.sol";
import "./Permissions.sol";
import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
    mapping(address => uint16) public defaultRoles;
    // mapping(uint16 => Role) internal roles;
    RoleList roleList;

    address public multiSend;

    event AssignRoles(address module, uint16[] roles);
    event SetMulitSendAddress(address multiSendAddress);
    event SetParametersScoped(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool scoped,
        bool[] paramsScoped,
        bool[] types,
        Comp.Comparison[] compTypes
    );

    event SetTargetAddressAllowed(
        uint16 role,
        address targetAddress,
        bool allowed
    );
    event SetTargetAddressScoped(
        uint16 role,
        address targetAddress,
        bool scoped
    );
    event SetSendAllowedOnTargetAddress(
        uint16 role,
        address targetAddress,
        bool allowed
    );
    event SetDelegateCallAllowedOnTargetAddress(
        uint16 role,
        address targetAddress,
        bool allowed
    );
    event SetFunctionAllowedOnTargetAddress(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        bool allowed
    );
    event SetParameterAllowedValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 parameterIndex,
        bytes value,
        bool allowed
    );
    event SetParameterCompValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 parameterIndex,
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

    /// @dev Set whether or not calls can be made to an address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) calls to target address.
    function setTargetAddressAllowed(
        uint16 role,
        address targetAddress,
        bool allow
    ) external onlyOwner {
        roleList.roles[role].targetAddresses[targetAddress].allowed = allow;
        emit SetTargetAddressAllowed(role, targetAddress, allow);
    }

    /// @dev Set whether or not delegate calls can be made to a target address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to which delegate calls should be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) delegate calls to target address.
    function setDelegateCallAllowedOnTargetAddress(
        uint16 role,
        address targetAddress,
        bool allow
    ) external onlyOwner {
        roleList
            .roles[role]
            .targetAddresses[targetAddress]
            .delegateCallAllowed = allow;

        emit SetDelegateCallAllowedOnTargetAddress(role, targetAddress, allow);
    }

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    function setTargetAddressScoped(
        uint16 role,
        address targetAddress,
        bool scoped
    ) external onlyOwner {
        roleList.roles[role].targetAddresses[targetAddress].scoped = scoped;
        emit SetTargetAddressScoped(role, targetAddress, scoped);
    }

    /// @dev Sets whether or not calls should be scoped to specific parameter value or range of values.
    /// @notice Only callable by owner.
    /// @param role Role to set for.
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature.
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    /// @param paramsScoped false for un-scoped, true for scoped.
    /// @param types false for static, true for dynamic.
    /// @param compTypes Any, or EqualTo, GreaterThan, or LessThan compValue.
    function setParametersScoped(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool scoped,
        bool[] memory paramsScoped,
        bool[] memory types,
        Comp.Comparison[] memory compTypes
    ) external onlyOwner {
        Permissions.setParametersScoped(
            roleList,
            role,
            targetAddress,
            functionSig,
            scoped,
            paramsScoped,
            types,
            compTypes
        );
        emit SetParametersScoped(
            role,
            targetAddress,
            functionSig,
            scoped,
            paramsScoped,
            types,
            compTypes
        );
    }

    /// @dev Sets whether or not a target address can be sent to (incluces fallback/receive functions).
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be allow/disallow sends to.
    /// @param allow Bool to allow (true) or disallow (false) sends on target address.
    function setSendAllowedOnTargetAddress(
        uint16 role,
        address targetAddress,
        bool allow
    ) external onlyOwner {
        roleList.roles[role].targetAddresses[targetAddress].sendAllowed = allow;
        emit SetSendAllowedOnTargetAddress(role, targetAddress, allow);
    }

    /// @dev Sets whether or not a specific function signature should be allowed on a scoped target address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Scoped address on which a function signature should be allowed/disallowed.
    /// @param functionSig Function signature to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) calls a function signature on target address.
    function setAllowedFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool allow
    ) external onlyOwner {
        Permissions.setAllowedFunction(
            roleList,
            role,
            targetAddress,
            functionSig,
            allow
        );
        emit SetFunctionAllowedOnTargetAddress(
            role,
            targetAddress,
            functionSig,
            allow
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
        uint16 paramIndex,
        bytes memory value,
        bool allow
    ) external onlyOwner {
        roleList
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .allowed[
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
        uint16 paramIndex,
        bytes memory compValue
    ) external onlyOwner {
        roleList
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .compValue = compValue.length > 32
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
            roleList.roles[_roles[i]].members[module] = memberOf[i];
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

    /// @dev Returns the comparison type of a given parameter.
    /// @param role The role to check.
    /// @param targetAddress Target address to check.
    /// @param functionSig Function signature for the function to check.
    /// @param paramIndex Index of the parameter to check.
    function getCompType(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 paramIndex
    ) public view returns (Comp.Comparison) {
        // TODO we can delete this function, but some tests are relying on it, so leaving it in for now

        uint256 paramConfig = roleList
            .roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramConfig;

        // doing the unpacking inline since will be deleted
        uint256 mask = 3 << (2 * paramIndex);
        return Comp.Comparison((paramConfig & mask) >> (2 * paramIndex));
    }

    /// @dev Returns the comparison value for a parameter.
    /// @param role The role to check.
    /// @param targetAddress Target address to check.
    /// @param functionSig Function signature for the function to check.
    /// @param paramIndex Index of the parameter to check.
    function getCompValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 paramIndex
    ) public view returns (bytes32) {
        return
            roleList
                .roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .values[paramIndex]
                .compValue;
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
        if (!roleList.roles[role].members[msg.sender]) {
            revert NoMembership();
        }
        if (to == multiSend) {
            Permissions.checkMultiSend(roleList, data, role);
        } else {
            Permissions.checkTransaction(
                roleList,
                to,
                value,
                data,
                operation,
                role
            );
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
        if (!roleList.roles[role].members[msg.sender]) {
            revert NoMembership();
        }
        if (to == multiSend) {
            Permissions.checkMultiSend(roleList, data, role);
        } else {
            Permissions.checkTransaction(
                roleList,
                to,
                value,
                data,
                operation,
                role
            );
        }
        return execAndReturnData(to, value, data, operation);
    }
}
