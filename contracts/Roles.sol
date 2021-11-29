// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
    // struct Parameter {
    //     mapping(bytes => bool) allowed;
    // }

    struct Function {
        bool allowed;
        bool scoped;
        string name;
        bool[] paramTypes;
        mapping(uint16 => bytes) allowedValues; // make array and bring back mapping for values?
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
    mapping(uint16 => Role) roles;

    event AssignRoles(address module, uint16[] roles);
    event SetParametersScoped(
        uint16 role,
        address target,
        bytes4 functionSig,
        bool[] types,
        bool scoped
    );
    event SetParameterScoped(
        uint16 role,
        address target,
        bytes4 functionSig,
        string parameter,
        bool scoped
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
    event SetParameterAllowedValues(
        uint16 role,
        address target,
        bytes4 functionSig,
        uint16 parameterIndex,
        bytes allowedValue
    );
    event RolesModSetup(
        address indexed initiator,
        address indexed owner,
        address indexed avatar,
        address target
    );

    /// `setUpModules` has already been called
    error SetUpModulesAlreadyCalled();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Role not allowed to delegate call to target address
    error DelegateCallNotAllowed();

    /// Role not allowed to call target address
    error TargetAddressNotAllowed();

    /// Role not allowed to call this function on target address
    error FunctionNotAllowed();

    /// Role not allowed to send to target address
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

        emit RolesModSetup(msg.sender, _owner, _avatar, _target);
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
            roles[role].targetAddresses[targetAddress].delegateCallAllowed
        );
    }

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    function setFunctionScoped(
        uint16 role,
        address targetAddress,
        bool scoped
    ) external onlyOwner {
        roles[role].targetAddresses[targetAddress].scoped = scoped;
        emit SetTargetAddressScoped(
            role,
            targetAddress,
            roles[role].targetAddresses[targetAddress].scoped
        );
    }

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature
    /// @param types false for static, true for dynamic
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    function setParametersScoped(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool[] memory types,
        bool scoped
    ) external onlyOwner {
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .scoped = scoped;
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .paramTypes = types;
        emit SetParametersScoped(
            role,
            target,
            functionSig,
            types,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .scoped = scoped
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
            roles[role].targetAddresses[targetAddress].sendAllowed
        );
    }

    /// @dev Sets whether or not a specific function signature should be allowed on a scoped target address.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Scoped address on which a function signature should be allowed/disallowed.
    /// @param selector Function signature to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) calls a function signature on target address.
    function setAllowedFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        bool allow
    ) external onlyOwner {
        roles[role]
            .targetAddresses[targetAddress]
            .functions[selector]
            .allowed = allow;
        emit SetFunctionAllowedOnTargetAddress(
            role,
            targetAddress,
            selector,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[selector]
                .allowed
        );
    }

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param role Role to set for
    /// @param targetAddress Address to be scoped/unscoped.
    /// @param functionSig first 4 bytes of the sha256 of the function signature
    /// @param paramIndex index of the parameter to scope
    /// @param allowedValue the allowed parameter value that can be called
    function setParameterAllowedValue(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint16 paramIndex,
        bytes memory allowedValue
    ) external onlyOwner {
        // todo: require that param is scoped first?
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .allowedValues[paramIndex] = allowedValue;
        emit SetParameterAllowedValues(
            role,
            target,
            functionSig,
            paramIndex,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .allowedValues[paramIndex]
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
    /// @param selector Signature to check.
    function isAllowedFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector
    ) public view returns (bool) {
        return (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[selector]
                .allowed
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

    function checkParameters(
        uint16 role,
        address targetAddress,
        bytes memory data
    ) internal returns (bool) {
        uint16 pos = 4; // skip function selector
        for (
            uint16 i = 0;
            i <
            roles[role]
                .targetAddresses[targetAddress]
                .functions[bytes4(data)]
                .paramTypes
                .length;
            i++
        ) {
            bool paramType = roles[role]
                .targetAddresses[targetAddress]
                .functions[bytes4(data)]
                .paramTypes[i];
            bytes memory paramBytes = roles[role]
                .targetAddresses[targetAddress]
                .functions[bytes4(data)]
                .allowedValues[i];
            if (paramType == true) {
                pos += 32; // location of length
                uint256 lengthLocation;
                assembly {
                    lengthLocation := mload(add(data, pos))
                }
                uint256 lengthPos = 36 + lengthLocation; // always start from param block start
                uint256 length;
                assembly {
                    length := mload(add(data, lengthPos))
                }
                if (length > 32) {
                    // check 1 word at a time
                    uint256 iterations = length / 32;
                    if (length % 32 != 0) {
                        iterations++;
                    }
                    for (uint256 x = 1; x <= iterations; x++) {
                        uint256 startScan = lengthPos + (32 * x);
                        uint256 startParamScan = 32 * x;
                        bytes32 scan;
                        bytes32 pbytes;
                        assembly {
                            scan := mload(add(data, startScan))
                        }
                        assembly {
                            pbytes := mload(add(paramBytes, startParamScan))
                        }
                        if (scan != pbytes) {
                            revert ParameterNotAllowed();
                        }
                    }
                } else {
                    bytes32 input;
                    uint256 dataLocation = lengthPos + 32;
                    assembly {
                        input := mload(add(data, dataLocation))
                    }
                    if (input != bytes32(paramBytes)) {
                        revert ParameterNotAllowed();
                    }
                }
            } else {
                pos += 32;
                bytes32 decoded;
                assembly {
                    decoded := mload(add(data, pos))
                }
                if (decoded != bytes32(paramBytes)) {
                    revert ParameterNotAllowed();
                }
            }
        }
    }

    function checkTransaction(
        address targetAddress,
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
            !roles[role].targetAddresses[targetAddress].delegateCallAllowed
        ) {
            revert DelegateCallNotAllowed();
        }

        if (!roles[role].targetAddresses[targetAddress].allowed) {
            revert TargetAddressNotAllowed();
        }
        if (data.length >= 4) {
            if (
                roles[role].targetAddresses[targetAddress].scoped &&
                !roles[role]
                    .targetAddresses[targetAddress]
                    .functions[bytes4(data)]
                    .allowed
            ) {
                revert FunctionNotAllowed();
            }
            if (
                roles[role]
                    .targetAddresses[targetAddress]
                    .functions[bytes4(data)]
                    .scoped
            ) {
                checkParameters(role, targetAddress, data);
            }
        } else {
            if (
                roles[role].targetAddresses[targetAddress].scoped &&
                !roles[role].targetAddresses[targetAddress].sendAllowed
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

    function strEql(string memory a, string memory b)
        internal
        view
        returns (bool)
    {
        if (bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return keccak256(bytes(a)) == keccak256(bytes(b));
        }
    }

    function bytesEql(bytes memory a, bytes memory b)
        internal
        view
        returns (bool)
    {
        if (a.length != b.length) {
            return false;
        } else {
            return keccak256(a) == keccak256(b);
        }
    }
}
