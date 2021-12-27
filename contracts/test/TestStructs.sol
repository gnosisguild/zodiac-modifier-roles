// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;
import "../Comp.sol";

contract TestStructs {
    struct Parameter {
        mapping(bytes => bool) allowed;
        bytes compValue;
    }

    struct Function {
        bool allowed;
        bool scoped;
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

    function setTargetAddressAllowed(
        uint16 role,
        address targetAddress,
        bool allow
    ) external {
        roles[role].targetAddresses[targetAddress].allowed = allow;
        emit SetTargetAddressAllowed(
            role,
            targetAddress,
            roles[role].targetAddresses[targetAddress].allowed
        );
    }

    function setParametersScoped(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool scoped,
        bool[] memory paramsScoped,
        bool[] memory types,
        Comp.Comparison[] memory compTypes
    ) external {
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
    ) external {
        roles[role].targetAddresses[targetAddress].sendAllowed = allow;
        emit SetSendAllowedOnTargetAddress(
            role,
            targetAddress,
            isSendAllowed(role, targetAddress)
        );
    }

    function isSendAllowed(uint16 role, address targetAddress)
        public
        view
        returns (bool)
    {
        return (roles[role].targetAddresses[targetAddress].sendAllowed);
    }
}
