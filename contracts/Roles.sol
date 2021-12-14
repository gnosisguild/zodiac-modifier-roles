// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "./Comp.sol";
import "./TransactionCheck.sol";
import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
    struct Parameter {
        mapping(bytes => bool) allowed;
        bytes compValue;
    }

    struct Function {
        bool allowed;
        bool scoped;
        string name;
        bool[] paramsScoped;
        bool[] paramTypes;
        mapping(uint16 => Parameter) values;
        Comp.Comparison[] compTypes;
    }

    struct TargetAddress {
        bool allowed;
        bool scoped;
        bool delegateCallAllowed;
        bool sendAllowed;
        mapping(bytes4 => Function) functions;
    }

    struct Role {
        mapping(address => TargetAddress) targetAddresses;
        mapping(address => bool) members;
    }

    mapping(address => uint16) public defaultRoles;
    mapping(uint16 => Role) internal roles;
    mapping(address => bool) public multiSendAddresses;

    event AssignRoles(address module, uint16[] roles);
    event SetMulitSendAddress(address multiSendAddress, bool allowed);
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
    /// @param multiSendAddress address of the multisend library contract
    /// @param allow bool, whether or not _multisendAddress is allowed
    function setMultiSend(address multiSendAddress, bool allow)
        external
        onlyOwner
    {
        multiSendAddresses[multiSendAddress] = allow;
        emit SetMulitSendAddress(
            multiSendAddress,
            multiSendAddresses[multiSendAddress]
        );
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
        roles[role].targetAddresses[targetAddress].allowed = allow;
        emit SetTargetAddressAllowed(
            role,
            targetAddress,
            roles[role].targetAddresses[targetAddress].allowed
        );
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
        roles[role].targetAddresses[targetAddress].delegateCallAllowed = allow;

        emit SetDelegateCallAllowedOnTargetAddress(
            role,
            targetAddress,
            isAllowedToDelegateCall(role, targetAddress)
        );
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
        roles[role].targetAddresses[targetAddress].scoped = scoped;
        emit SetTargetAddressScoped(
            role,
            targetAddress,
            isScoped(role, targetAddress)
        );
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
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .scoped = scoped;
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramTypes = types;
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramsScoped = paramsScoped;
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .compTypes = compTypes;
        emit SetParametersScoped(
            role,
            targetAddress,
            functionSig,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .scoped,
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
        roles[role].targetAddresses[targetAddress].sendAllowed = allow;
        emit SetSendAllowedOnTargetAddress(
            role,
            targetAddress,
            isSendAllowed(role, targetAddress)
        );
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
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .allowed = allow;
        emit SetFunctionAllowedOnTargetAddress(
            role,
            targetAddress,
            functionSig,
            isAllowedFunction(role, targetAddress, functionSig)
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
        // todo: require that param is scoped first?
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .allowed[value] = allow;

        emit SetParameterAllowedValue(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            value,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .values[paramIndex]
                .allowed[value]
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
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .values[paramIndex]
            .compValue = compValue;

        emit SetParameterCompValue(
            role,
            targetAddress,
            functionSig,
            paramIndex,
            getCompValue(role, targetAddress, functionSig, paramIndex)
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
        emit SetDefaultRole(module, getDefaultRole(module));
    }

    /// @dev Returns the default role for a given module.
    /// @param module Module to be checked.
    /// @return Default role of given module.
    function getDefaultRole(address module) public view returns (uint16) {
        return defaultRoles[module];
    }

    /// @dev Returns details on whether and how functions parameters are scoped.
    /// @param role Role to check.
    /// @param targetAddress Target address to check.
    /// @param functionSig Function signature of the function to check.
    /// @return bool describing whether (true) or not (false) the function is scoped.
    /// @return bool[] describing parameter types are variable(true) or fixed (false) length.
    /// @return bool[] describing whether (true) or not (false) the parameters are scoped.
    /// @return Comp.Comparison[] describing the comparison type for each parameter: EqualTo, GreaterThan, or LessThan.
    function getParameterScopes(
        uint16 role,
        address targetAddress,
        bytes4 functionSig
    )
        public
        view
        returns (
            bool,
            bool[] memory,
            bool[] memory,
            Comp.Comparison[] memory
        )
    {
        return (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .scoped,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .paramTypes,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .paramsScoped,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .compTypes
        );
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
        return
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .compTypes[paramIndex];
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
    ) public view returns (bytes memory) {
        return
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .values[paramIndex]
                .compValue;
    }

    /// @dev Returns bool to indicate whether (true) or not (false) a given module is a member of a role.
    /// @param role Role to check.
    /// @param module Module to check.
    /// @return bool indicating whether module is a member or role.
    function isRoleMember(uint16 role, address module)
        public
        view
        returns (bool)
    {
        return roles[role].members[module];
    }

    /// @dev Returns bool to indicate if an address is an allowed multisend
    /// @param multiSend address to check
    function isAllowedMultiSend(address multiSend) public view returns (bool) {
        return (multiSendAddresses[multiSend]);
    }

    /// @dev Returns bool to indicate if an address is an allowed target address.
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    function isAllowedTargetAddress(uint16 role, address targetAddress)
        public
        view
        returns (bool)
    {
        return (roles[role].targetAddresses[targetAddress].allowed);
    }

    /// @dev Returns bool to indicate if an address is scoped.
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    function isScoped(uint16 role, address targetAddress)
        public
        view
        returns (bool)
    {
        return (roles[role].targetAddresses[targetAddress].scoped);
    }

    /// @dev Returns bool to indicate if an address is scoped.
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    function isSendAllowed(uint16 role, address targetAddress)
        public
        view
        returns (bool)
    {
        return (roles[role].targetAddresses[targetAddress].sendAllowed);
    }

    /// @dev Returns bool to indicate if a function signature is allowed for a target address.
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    /// @param functionSig Signature to check.
    function isAllowedFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig
    ) public view returns (bool) {
        return (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .allowed
        );
    }

    /// @dev Returns bool to indicate if a given function signature is scoped.
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    /// @param functionSig Signature to check.
    function isFunctionScoped(
        uint16 role,
        address targetAddress,
        bytes4 functionSig
    ) public view returns (bool) {
        return (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .scoped
        );
    }

    /// @dev Returns bool to indicate if delegate calls are allowed to a target address.
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    function isAllowedToDelegateCall(uint16 role, address targetAddress)
        public
        view
        returns (bool)
    {
        return (roles[role].targetAddresses[targetAddress].delegateCallAllowed);
    }

    /// @dev Returns bool to indicate if a value is allowed for a parameter on a function at a target address for a role.
    /// @param role Role to check.
    /// @param targetAddress Address to check.
    /// @param functionSig Function signature to check.
    /// @param paramIndex Parameter index to check.
    /// @param value Value to check.
    function isAllowedValueForParam(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 paramIndex,
        bytes memory value
    ) public view returns (bool) {
        if (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .compTypes[paramIndex] == Comp.Comparison.EqualTo
        ) {
            return
                roles[role]
                    .targetAddresses[targetAddress]
                    .functions[functionSig]
                    .values[paramIndex]
                    .allowed[value];
        } else if (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .compTypes[paramIndex] == Comp.Comparison.GreaterThan
        ) {
            if (
                bytes32(value) >
                bytes32(
                    roles[role]
                        .targetAddresses[targetAddress]
                        .functions[functionSig]
                        .values[paramIndex]
                        .compValue
                )
            ) {
                return true;
            } else {
                return false;
            }
        } else if (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .compTypes[paramIndex] == Comp.Comparison.LessThan
        ) {
            if (
                bytes32(value) <
                bytes32(
                    roles[role]
                        .targetAddresses[targetAddress]
                        .functions[functionSig]
                        .values[paramIndex]
                        .compValue
                )
            ) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /// @dev Splits a multisend data blob into transactions and forwards them to be checked.
    /// @param transactions the packed transaction data (created by utils function buildMultiSendSafeTx).
    /// @param role Role to check for.
    function checkMultiSend(bytes memory transactions, uint16 role)
        internal
        view
    {
        TransactionCheck.checkMultiSend(transactions, role);
    }

    function checkParameter(
        address targetAddress,
        uint16 role,
        bytes memory data,
        uint16 paramIndex,
        bytes memory value
    ) internal view {
        TransactionCheck.checkParameter(
            targetAddress,
            role,
            data,
            paramIndex,
            value
        );
    }

    /// @dev Will revert if a transaction has a parameter that is not allowed
    /// @param role Role to check for.
    /// @param targetAddress Address to check.
    /// @param data the transaction data to check
    function checkParameters(
        uint16 role,
        address targetAddress,
        bytes memory data
    ) internal view {
        TransactionCheck.checkParameters(role, targetAddress, data);
    }

    function checkTransaction(
        address targetAddress,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint16 role
    ) internal view {
        TransactionCheck.checkTransaction(
            targetAddress,
            value,
            data,
            operation,
            role
        );
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
        if (!roles[role].members[msg.sender]) {
            revert NoMembership();
        }
        if (multiSendAddresses[to]) {
            checkMultiSend(data, role);
        } else {
            checkTransaction(to, value, data, operation, role);
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
        if (!roles[role].members[msg.sender]) {
            revert NoMembership();
        }
        if (multiSendAddresses[to]) {
            checkMultiSend(data, role);
        } else {
            checkTransaction(to, value, data, operation, role);
        }
        return execAndReturnData(to, value, data, operation);
    }
}
