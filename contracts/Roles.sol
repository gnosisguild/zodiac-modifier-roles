// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
    // struct Parameter {
    //     mapping(bytes => bool) allowed;
    // }

    struct Function {
        bool allowed;
        string name;
    }

    struct Target {
        bool allowed;
        bool scoped;
        bool delegateCallAllowed;
        bool sendAllowed;
        mapping(bytes4 => Function) functions;
    }

    struct Role {
        uint16 id;
        mapping(address => Target) targets;
        mapping(address => bool) members;
    }

    mapping(address => uint16) public defaultRoles;
    mapping(uint16 => Role) public roles;

    event AssignRoles(address module, uint16[] roles);
    event SetTargetAllowed(uint16 role, address target, bool allowed);
    event SetTargetScoped(uint16 role, address target, bool scoped);
    event SetSendAllowedOnTarget(uint16 role, address target, bool allowed);
    event SetDelegateCallAllowedOnTarget(
        uint16 role,
        address target,
        bool allowed
    );
    event SetFunctionAllowedOnTarget(
        uint16 role,
        address target,
        bytes4 selector,
        bool allowed
    );
    event RolesSetup(
        address indexed initiator,
        address indexed owner,
        address indexed avatar,
        address target
    );

    /// `setUpModules` has already been called
    error SetUpModulesAlreadyCalled();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Role is not allowed to perform this transaction
    error NotAllowed(
        uint16 role,
        address to,
        uint256 value,
        bytes data,
        Enum.Operation operation
    );

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

        emit RolesSetup(msg.sender, _owner, _avatar, _target);
    }

    function setupModules() internal {
        if (modules[SENTINEL_MODULES] != address(0)) {
            revert SetUpModulesAlreadyCalled();
        }
        modules[SENTINEL_MODULES] = SENTINEL_MODULES;
    }

    /// @dev Set whether or not calls can be made to an address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param target Address to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) calls to target.
    function setTargetAllowed(
        uint16 role,
        address target,
        bool allow
    ) external onlyOwner {
        roles[role].targets[target].allowed = allow;
        emit SetTargetAllowed(
            role,
            target,
            roles[role].targets[target].allowed
        );
    }

    /// @dev Set whether or not delegate calls can be made to a target.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param target Address to which delegate calls should be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) delegate calls to target.
    function setDelegateCallAllowedOnTarget(
        uint16 role,
        address target,
        bool allow
    ) external onlyOwner {
        roles[role].targets[target].delegateCallAllowed = allow;

        emit SetDelegateCallAllowedOnTarget(
            role,
            target,
            roles[role].targets[target].delegateCallAllowed
        );
    }

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param target Address to be scoped/unscoped.
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    function setScoped(
        uint16 role,
        address target,
        bool scoped
    ) external onlyOwner {
        roles[role].targets[target].scoped = scoped;
        emit SetTargetScoped(role, target, roles[role].targets[target].scoped);
    }

    /// @dev Sets whether or not a target can be sent to (incluces fallback/receive functions).
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param target Address to be allow/disallow sends to.
    /// @param allow Bool to allow (true) or disallow (false) sends on target.
    function setSendAllowedOnTarget(
        uint16 role,
        address target,
        bool allow
    ) external onlyOwner {
        roles[role].targets[target].sendAllowed = allow;
        emit SetSendAllowedOnTarget(
            role,
            target,
            roles[role].targets[target].sendAllowed
        );
    }

    /// @dev Sets whether or not a specific function signature should be allowed on a scoped target.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param target Scoped address on which a function signature should be allowed/disallowed.
    /// @param selector Function signature to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) calls a function signature on target.
    function setAllowedFunction(
        uint16 role,
        address target,
        bytes4 selector,
        bool allow
    ) external onlyOwner {
        roles[role].targets[target].functions[selector].allowed = allow;
        emit SetFunctionAllowedOnTarget(
            role,
            target,
            selector,
            roles[role].targets[target].functions[selector].allowed
        );
    }

    function assignRoles(address module, uint16[] calldata _roles)
        external
        onlyOwner
    {
        for (uint16 i = 0; i < _roles.length; i++) {
            roles[_roles[i]].members[module] = true;
        }
        if (!isModuleEnabled(module)) {
            enableModule(module);
        }
        emit AssignRoles(module, _roles);
    }

    function setDefaultRole(address module, uint16 role) external onlyOwner {
        defaultRoles[module] = role;
    }

    function getDefaultRole(address module) external view returns (uint16) {
        return defaultRoles[module];
    }

    function isRoleMember(address module, uint16 role)
        external
        view
        returns (bool)
    {
        return roles[role].members[module];
    }

    /// @dev Returns bool to indicate if an address is an allowed target.
    /// @param role Role to check for.
    /// @param target Address to check.
    function isAllowedTarget(uint16 role, address target)
        public
        view
        returns (bool)
    {
        return (roles[role].targets[target].allowed);
    }

    /// @dev Returns bool to indicate if an address is scoped.
    /// @param role Role to check for.
    /// @param target Address to check.
    function isScoped(uint16 role, address target) public view returns (bool) {
        return (roles[role].targets[target].scoped);
    }

    /// @dev Returns bool to indicate if an address is scoped.
    /// @param role Role to check for.
    /// @param target Address to check.
    function isSendAllowed(uint16 role, address target)
        public
        view
        returns (bool)
    {
        return (roles[role].targets[target].sendAllowed);
    }

    /// @dev Returns bool to indicate if a function signature is allowed for a target address.
    /// @param role Role to check for.
    /// @param target Address to check.
    /// @param selector Signature to check.
    function isAllowedFunction(
        uint16 role,
        address target,
        bytes4 selector
    ) public view returns (bool) {
        return (roles[role].targets[target].functions[selector].allowed);
    }

    /// @dev Returns bool to indicate if delegate calls are allowed to a target address.
    /// @param role Role to check for.
    /// @param target Address to check.
    function isAllowedToDelegateCall(uint16 role, address target)
        public
        view
        returns (bool)
    {
        return (roles[role].targets[target].delegateCallAllowed);
    }

    // TODO maybe make it interal to save gas?
    function isAllowedTransaction(
        uint16 role,
        address target,
        bytes memory data,
        Enum.Operation operation
    ) public view returns (bool) {
        if (
            operation == Enum.Operation.DelegateCall &&
            !roles[role].targets[target].delegateCallAllowed
        ) {
            return false;
        }

        if (!roles[role].targets[target].allowed) {
            return false;
        }
        if (data.length >= 4) {
            if (
                roles[role].targets[target].scoped &&
                !roles[role].targets[target].functions[bytes4(data)].allowed
            ) {
                return false;
            }
        } else {
            if (
                roles[role].targets[target].scoped &&
                !roles[role].targets[target].sendAllowed
            ) {
                return false;
            }
        }

        return true;
    }

    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) internal view {
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }
        if (
            !isAllowedTransaction(defaultRoles[msg.sender], to, data, operation)
        ) {
            revert NotAllowed(
                defaultRoles[msg.sender],
                to,
                value,
                data,
                operation
            );
        }
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
        checkTransaction(to, value, data, operation);
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
    )
        public
        override
        moduleOnly
        returns (bool success, bytes memory returnData)
    {
        checkTransaction(to, value, data, operation);
        return execAndReturnData(to, value, data, operation);
    }
}
