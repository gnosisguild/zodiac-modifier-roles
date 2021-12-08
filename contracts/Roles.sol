// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
    bytes public test;
    address public test2;
    uint256 public test3;

    enum Comparison {
        EqualTo,
        GreaterThan,
        LessThan
    }

    struct Parameter {
        Comparison compType;
        mapping(bytes => bool) allowed;
        bytes compValue;
    }

    struct Function {
        bool allowed;
        bool scoped;
        string name;
        bool[] paramsScoped;
        bool[] paramTypes;
        mapping(uint16 => Parameter) allowedValues;
    }

    struct TargetAddress {
        bool allowed;
        bool scoped;
        bool delegateCallAllowed;
        bool sendAllowed;
        bool isMultiSend;
        mapping(bytes4 => Function) functions;
    }

    struct Role {
        mapping(address => TargetAddress) targetAddresses;
        mapping(address => bool) members;
    }

    mapping(address => uint16) public defaultRoles;
    mapping(uint16 => Role) internal roles;
    address public multiSendAddress;

    event AssignRoles(address module, uint16[] roles);
    event SetParametersScoped(
        uint16 role,
        address target,
        bytes4 functionSig,
        bool scoped,
        bool[] paramsScoped,
        bool[] types,
        Comparison[] compTypes
    );
    // event SetParameterScoped(
    //     uint16 role,
    //     address target,
    //     bytes4 functionSig,
    //     string parameter,
    //     bool scoped
    // );
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
        bool allowed,
        Comparison compType,
        bytes compValue
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

    function setMultiSend(address _multiSendAddress) external onlyOwner {
        multiSendAddress = _multiSendAddress;
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
        Comparison[] memory compTypes
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
        bytes memory allowedValue,
        Comparison compType,
        bytes memory compValue
    ) external onlyOwner {
        // todo: require that param is scoped first?
        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .allowedValues[paramIndex]
            .allowed[allowedValue] = true;

        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .allowedValues[paramIndex]
            .compType = compType;

        roles[role]
            .targetAddresses[targetAddress]
            .functions[functionSig]
            .allowedValues[paramIndex]
            .compValue = compValue;

        emit SetParameterAllowedValues(
            role,
            target,
            functionSig,
            paramIndex,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .allowedValues[paramIndex]
                .allowed[allowedValue],
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .allowedValues[paramIndex]
                .compType,
            roles[role]
                .targetAddresses[targetAddress]
                .functions[functionSig]
                .allowedValues[paramIndex]
                .compValue
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

    function splitMultiSend(bytes memory transactions, uint16 role) internal {
        // solhint-disable-next-line no-inline-assembly
        Enum.Operation operation;
        address to;
        uint256 value;
        bytes memory data;
        uint256 dataLength;
        uint256 length;
        for (uint256 i = 100; i < transactions.length; i += (85 + dataLength)) {
            assembly {
                operation := shr(0xf8, mload(add(transactions, i)))
                to := shr(0x60, mload(add(transactions, add(i, 0x01))))
                value := mload(add(transactions, add(i, 0x15)))
                dataLength := mload(add(transactions, add(i, 0x35)))
                data := add(transactions, add(i, 0x35))
            }
            checkTransaction(to, value, data, operation, role);
        }
        // assembly {
        //     length := mload(transactions)
        //     count := 0
        //     lengthTotal := 0
        //     let i := 0x64 // we skip past the first 4 bytes + length location + length
        //     for {
        //         // Pre block is not used in "while mode"
        //     } lt(i, length) {
        //         // Post block is not used in "while mode"
        //     } {
        //         // First byte of the data is the operation.
        //         // We shift by 248 bits (256 - 8 [operation byte]) it right since mload will always load 32 bytes (a word).
        //         // This will also zero out unused data.
        //         op := shr(0xf8, mload(add(transactions, i)))
        //         // We offset the load address by 1 byte (operation byte)
        //         // We shift it right by 96 bits (256 - 160 [20 address bytes]) to right-align the data and zero out unused data.
        //         tos := shr(0x60, mload(add(transactions, add(i, 0x01))))
        //         // We offset the load address by 21 byte (operation byte + 20 address bytes)
        //         values := mload(add(transactions, add(i, 0x15)))
        //         // We offset the load address by 53 byte (operation byte + 20 address bytes + 32 value bytes)
        //         dataLength := mload(add(transactions, add(i, 0x35)))
        //         // We offset the load address by 85 byte (operation byte + 20 address bytes + 32 value bytes + 32 data length bytes)
        //         data := add(transactions, add(i, 0x35))
        //         // Next entry starts at 85 byte + data length
        //         mstore(add(datas, add(0x20, lengthTotal)), data)
        //         mstore(add(addresses, add(0x20, mul(0x20, count))), tos)
        //         lengthTotal := add(lengthTotal, dataLength)
        //         count := add(count, 1)
        //         mstore(addresses, count)
        //         mstore(datas, count)
        //         i := add(i, add(0x55, dataLength))
        //     }
        // }
        // bytes memory t = sliceBytes(data, 68, 0);
        // test = t;
        test = sliceBytes(data, 68, 0);
        test2 = to;
        test3 = transactions.length;
    }

    function testBytes(bytes memory tester) public {
        bytes memory _t = tester;
    }

    function checkParameter(
        address targetAddress,
        uint16 role,
        bytes memory data,
        uint16 i,
        bytes memory out
    ) internal view {
        if (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[bytes4(data)]
                .allowedValues[i]
                .compType ==
            Comparison.EqualTo &&
            !roles[role]
                .targetAddresses[targetAddress]
                .functions[bytes4(data)]
                .allowedValues[i]
                .allowed[out]
        ) {
            revert ParameterNotAllowed();
        } else if (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[bytes4(data)]
                .allowedValues[i]
                .compType ==
            Comparison.GreaterThan &&
            bytes32(out) <=
            bytes32(
                roles[role]
                    .targetAddresses[targetAddress]
                    .functions[bytes4(data)]
                    .allowedValues[i]
                    .compValue
            )
        ) {
            revert ParameterNotAllowed();
        } else if (
            roles[role]
                .targetAddresses[targetAddress]
                .functions[bytes4(data)]
                .allowedValues[i]
                .compType ==
            Comparison.LessThan &&
            bytes32(out) >=
            bytes32(
                roles[role]
                    .targetAddresses[targetAddress]
                    .functions[bytes4(data)]
                    .allowedValues[i]
                    .compValue
            )
        ) {
            revert ParameterNotAllowed();
        }
    }

    function checkParameters(
        uint16 role,
        address targetAddress,
        bytes memory data
    ) internal view {
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
                    bytes memory out = abi.encode(
                        sliceBytes(data, length, lengthPos)
                    );
                    checkParameter(targetAddress, role, data, i, out);
                } else {
                    bytes32 input;
                    uint256 dataLocation = lengthPos + 32;
                    assembly {
                        input := mload(add(data, dataLocation))
                    }
                    bytes memory out = abi.encodePacked(input);
                    checkParameter(targetAddress, role, data, i, out);
                }
            } else {
                pos += 32;
                bytes32 decoded;
                assembly {
                    decoded := mload(add(data, pos))
                }
                bytes memory out = abi.encodePacked(decoded);
                checkParameter(targetAddress, role, data, i, out);
            }
        }
    }

    function checkTransaction(
        address targetAddress,
        uint256,
        bytes memory data,
        Enum.Operation operation,
        uint16 role
    ) internal view {
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
        uint16 role = defaultRoles[msg.sender];
        if (to == multiSendAddress) {
            splitMultiSend(data, role);
        } else {
            checkTransaction(to, value, data, operation, role);
        }
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
        uint16 role = defaultRoles[msg.sender];
        if (to == multiSendAddress) {
            //bytes memory t = splitMultiSend(data);
        } else {
            checkTransaction(to, value, data, operation, role);
        }
        return execAndReturnData(to, value, data, operation);
    }

    function sliceBytes(
        bytes memory input,
        uint256 length,
        uint256 start
    ) internal pure returns (bytes memory) {
        bytes memory out = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            out[i] = input[start + i];
        }
        return out;
    }

    /**
     * @dev Reads `length` bytes of storage in the currents contract
     * @param offset - the offset in the current contract's storage in words to start reading from
     * @param length - the number of words (32 bytes) of data to read
     * @return the bytes that were read.
     */
    function getStorageAt(
        uint256 offset,
        uint256 length,
        bytes memory data
    ) public pure returns (bytes memory) {
        bytes memory result = new bytes(length * 32);
        for (uint256 index = 0; index < length; index++) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                let word := mload(add(add(offset, data), index))
                mstore(add(add(result, 0x20), mul(index, 0x20)), word)
            }
        }
        return result;
    }
}
