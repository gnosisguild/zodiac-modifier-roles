// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
    // struct Parameter {
    //     mapping(bytes => bool) allowed;
    // }

    uint256 public test;
    bytes32 public test2;

    struct Function {
        bool allowed;
        bool scoped;
        string name;
        string[] paramTypes;
        mapping (string => bytes) allowedValues; // make array and bring back mapping for values?
    }

    struct Target {
        bool allowed;
        bool scoped;
        bool delegateCallAllowed;
        bool sendAllowed;
        mapping(bytes4 => Function) functions;
    }

    struct Role {
        mapping(address => Target) targets;
        mapping(address => bool) members;
    }

    mapping(address => uint16) public defaultRoles;
    mapping(uint16 => Role) roles;

    event AssignRoles(address module, uint16[] roles);
    event SetTargetAllowed(uint16 role, address target, bool allowed);
    event SetTargetScoped(uint16 role, address target, bool scoped);
    event SetParametersScoped(uint16 role, address target, bytes4 functionSig, string[] types, bool scoped);
    event SetParameterScoped(uint16 role, address target, bytes4 functionSig, string parameter, bool scoped);  
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
    event SetParameterAllowedValues(
        uint16 role,
        address target,
        bytes4 functionSig,
        string parameter,
        bytes allowedValue
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

    /// Role not allowed to delegate call to target
    error DelegateCallNotAllowed();

    /// Role not allowed to call target
    error TargetNotAllowed();

    /// Role not allowed to call this function on target
    error FunctionNotAllowed();

    /// Role not allowed to send to target
    error SendNotAllowed();

    /// Role not allowed to use bytes for parameter
    error ParameterNotAllowed();

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
    function setFunctionScoped(
        uint16 role,
        address target,
        bool scoped
    ) external onlyOwner {
        roles[role].targets[target].scoped = scoped;
        emit SetTargetScoped(role, target, roles[role].targets[target].scoped);
    }

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param target Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    function setParametersScoped(
        uint16 role,
        address target,
        bytes4 functionSig,
        string[] memory types,
        bool scoped
    ) external onlyOwner {
        roles[role].targets[target].functions[functionSig].scoped = scoped;
        roles[role].targets[target].functions[functionSig].paramTypes = types;
        emit SetParametersScoped(
          role,
          target,
          functionSig,
          types,
          roles[role].targets[target].functions[functionSig].scoped = scoped
        );
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

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param target Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature
    /// @param paramType name of the parameter to scope
    /// @param allowedValue the allowed parameter value that can be called
    function setParameterAllowedValue(
        uint16 role,
        address target,
        bytes4 functionSig,
        string memory paramType,
        bytes memory allowedValue
    ) external onlyOwner {
        // todo: require that param is scoped first?
        roles[role].targets[target].functions[functionSig].allowedValues[paramType] = allowedValue;
        emit SetParameterAllowedValues(
          role,
          target,
          functionSig,
          paramType,
          roles[role].targets[target].functions[functionSig].allowedValues[paramType]
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
        return true;
    }

    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) internal {
        uint16 role = defaultRoles[msg.sender];
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }
        if (
            operation == Enum.Operation.DelegateCall &&
            !roles[role].targets[to].delegateCallAllowed
        ) {
            revert DelegateCallNotAllowed();
        }

        if (!roles[role].targets[to].allowed) {
            revert TargetNotAllowed();
        }
        if (data.length >= 4) {
            if (
                roles[role].targets[to].scoped &&
                !roles[role].targets[to].functions[bytes4(data)].allowed
            ) {
                revert FunctionNotAllowed();
            }
            if (roles[role].targets[to].functions[bytes4(data)].scoped) {
                uint16 pos = 4; // skip function selector
                for (uint i = 0; i < roles[role].targets[to].functions[bytes4(data)].paramTypes.length; i++) {
                    string memory paramType = roles[role].targets[to].functions[bytes4(data)].paramTypes[i];
                    bytes memory paramBytes = roles[role].targets[to].functions[bytes4(data)].allowedValues[paramType];
                    if (strEql(paramType, "bytes") || strEql(paramType, "string")) {
                        pos += 32; // location of length
                        uint256 lengthLocation;
                        assembly {lengthLocation := mload(add(data, pos))}
                        uint256 lengthPos = pos + lengthLocation;
                        uint256 length;
                        assembly {length := mload(add(data, lengthPos))}
                        // if length > 32, check 1 word at a time
                        bytes32 input;
                        uint256 dataLocation = lengthPos + 32;
                        assembly {input := mload(add(data, 100))}
                        if (input == bytes32(paramBytes)) {
                            test = 420;
                        }
                        test2 = input;
                        //test = length;
                        //uint256 input = abi.decode(paramBytes, (uint256));
                    } else {
                        pos += 32;
                        if (strEql(paramType, "address")) {
                            address decoded;
                            assembly {decoded := mload(add(data, pos))}
                            address input = abi.decode(paramBytes, (address));
                            if (input != decoded){
                                revert ParameterNotAllowed();
                            }
                        }
                        if (strEql(paramType, "uint256")) {
                            uint256 decoded;
                            assembly {decoded := mload(add(data, pos))}
                            uint256 input = abi.decode(paramBytes, (uint256));
                            if (input != decoded){
                                revert ParameterNotAllowed();
                            }
                        }
                    }
                }
            }
        } else {
            if (
                roles[role].targets[to].scoped &&
                !roles[role].targets[to].sendAllowed
            ) {
                revert SendNotAllowed();
            }
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

    function strEql(string memory a, string memory b) internal view returns (bool) {
        if(bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return keccak256(bytes(a)) == keccak256(bytes(b));
        }
    }

    function bytesEql(bytes memory a, bytes memory b) internal view returns (bool) {
        if(a.length != b.length) {
            return false;
        } else {
            return keccak256(a) == keccak256(b);
        }
    }
}
