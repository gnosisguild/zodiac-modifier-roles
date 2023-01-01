// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

import "./ScopeSetBuilder.sol";
import "./FunctionConfig.sol";
import "./Types.sol";

struct ParamConfig {
    ParameterType _type;
    Comparison comp;
    bytes compValue;
    bytes[] compValues;
}

abstract contract PermissionBuilder is ScopeSetBuilder {
    event AllowTarget(
        uint16 role,
        address targetAddress,
        ExecutionOptions options
    );
    event RevokeTarget(uint16 role, address targetAddress);
    event ScopeTarget(uint16 role, address targetAddress);
    event ScopeAllowFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options,
        uint256 resultingScopeConfig
    );
    event ScopeRevokeFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        uint256 resultingScopeConfig
    );
    event ScopeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool[] isParamScoped,
        ParameterType[] paramType,
        Comparison[] paramComp,
        bytes[] compValue,
        ExecutionOptions options,
        uint256 resultingScopeConfig
    );
    event ScopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint256 index,
        ParameterType paramType,
        Comparison paramComp,
        bytes compValue,
        uint256 resultingScopeConfig
    );
    event ScopeParameterAsOneOf(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint256 index,
        ParameterType paramType,
        bytes[] compValues,
        uint256 resultingScopeConfig
    );

    mapping(uint16 => Role) internal roles;

    /*
     *
     * SETTERS
     *
     */

    /// @dev Allows transactions to a target address.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function allowTarget(
        uint16 roleId,
        address targetAddress,
        ExecutionOptions options
    ) external onlyOwner {
        roles[roleId].targets[targetAddress] = TargetAddress(
            Clearance.Target,
            options,
            0
        );
        emit AllowTarget(roleId, targetAddress, options);
    }

    /// @dev Removes transactions to a target address.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function revokeTarget(
        uint16 roleId,
        address targetAddress
    ) external onlyOwner {
        roles[roleId].targets[targetAddress] = TargetAddress(
            Clearance.None,
            ExecutionOptions.None,
            0
        );
        emit RevokeTarget(roleId, targetAddress);
    }

    /// @dev Designates only specific functions can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function scopeTarget(
        uint16 roleId,
        address targetAddress
    ) external onlyOwner {
        roles[roleId].targets[targetAddress] = TargetAddress(
            Clearance.Function,
            ExecutionOptions.None,
            roles[roleId].targets[targetAddress].scopeSetId
        );
        emit ScopeTarget(roleId, targetAddress);
    }

    /// @dev Specifies the functions that can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function scopeAllowFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    ) external {
        uint16 scopeSetId = bindTargetToScopeSet(roleId, targetAddress);
        allowFunction_(scopeSetId, selector, options);
        emit ScopeAllowFunction(
            roleId,
            targetAddress,
            selector,
            options,
            0 // TODO
        );
    }

    /// @dev Removes the functions that can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    function scopeRevokeFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector
    ) external {
        uint16 scopeSetId = bindTargetToScopeSet(roleId, targetAddress);
        revokeFunction_(scopeSetId, selector);
        emit ScopeRevokeFunction(roleId, targetAddress, selector, 0);
    }

    /// @dev Defines the values that can be called for a given function for each param.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param isScoped marks which parameters are value restricted.
    /// @param paramType provides information about the type of parameter.
    /// @param paramComp the type of comparison for each parameter
    /// @param compValue the values to compare a param against.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function scopeFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector,
        bool[] memory isScoped,
        ParameterType[] memory paramType,
        Comparison[] memory paramComp,
        bytes[] calldata compValue,
        ExecutionOptions options
    ) external onlyOwner {
        uint16 scopeSetId = bindTargetToScopeSet(roleId, targetAddress);
        scopeFunction_(
            scopeSetId,
            selector,
            isScoped,
            paramType,
            paramComp,
            compValue,
            options
        );

        emit ScopeFunction(
            roleId,
            targetAddress,
            selector,
            isScoped,
            paramType,
            paramComp,
            compValue,
            options,
            0 // TODO
        );
    }

    /// @dev Defines the values that can be called for a given function for single param.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param index the index of the param to scope.
    /// @param paramType provides information about the type of parameter.
    /// @param compValues the values to compare a param against.
    function scopeParameterAsOneOf(
        uint16 roleId,
        address targetAddress,
        bytes4 selector,
        uint256 index,
        ParameterType paramType,
        bytes[] calldata compValues
    ) external onlyOwner {
        uint16 scopeSetId = bindTargetToScopeSet(roleId, targetAddress);
        scopeParameterAsOneOf_(
            scopeSetId,
            selector,
            index,
            paramType,
            compValues
        );

        emit ScopeParameterAsOneOf(
            roleId,
            targetAddress,
            selector,
            index,
            paramType,
            compValues,
            0 // TODO
        );
    }

    function bindTargetToScopeSet(
        uint16 roleId,
        address targetAddress
    ) private returns (uint16) {
        TargetAddress storage target = roles[roleId].targets[targetAddress];

        uint16 id = target.scopeSetId;

        if (scopeSets[id].created) {
            return id;
        }

        for (; ; ++id) {
            if (!scopeSets[id].created) {
                target.scopeSetId = id;
                return id;
            }
        }
        return 0;
    }
}
