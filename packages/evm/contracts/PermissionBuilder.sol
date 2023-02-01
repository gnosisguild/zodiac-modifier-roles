// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

import "./Types.sol";
import "./Integrity.sol";
import "./Topology.sol";
import "./ScopeConfig.sol";

abstract contract PermissionBuilder is OwnableUpgradeable {
    uint256 internal constant SCOPE_MAX_PARAMS = 32;

    event AllowTarget(
        uint16 role,
        address targetAddress,
        ExecutionOptions options
    );
    event RevokeTarget(uint16 role, address targetAddress);
    event ScopeTarget(uint16 role, address targetAddress);

    event AllowFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    );
    event RevokeFunction(uint16 role, address targetAddress, bytes4 selector);
    event ScopeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        ParameterConfigFlat[] parameters,
        ExecutionOptions options
    );

    mapping(uint16 => Role) internal roles;

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
            options
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
            ExecutionOptions.None
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
            ExecutionOptions.None
        );
        emit ScopeTarget(roleId, targetAddress);
    }

    /// @dev Specifies the functions that can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function allowFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    ) external onlyOwner {
        ScopeConfig.store(
            roles[roleId].functions[_key(targetAddress, selector)],
            ScopeConfig.createBuffer(0, true, options)
        );

        emit AllowFunction(roleId, targetAddress, selector, options);
    }

    /// @dev Removes the functions that can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    function revokeFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector
    ) external onlyOwner {
        ScopeConfig.prune(
            roles[roleId].functions[_key(targetAddress, selector)]
        );
        emit RevokeFunction(roleId, targetAddress, selector);
    }

    /// @dev Defines the values that can be called for a given function for each param.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function scopeFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector,
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    ) external onlyOwner {
        Integrity.validate(parameters);

        uint256 length = parameters.length;
        BitmapBuffer memory buffer = ScopeConfig.createBuffer(
            length,
            false,
            options
        );

        Role storage role = roles[roleId];
        for (uint8 i; i < length; ++i) {
            ParameterConfigFlat memory parameter = parameters[i];
            ScopeConfig.packParameter(buffer, parameter, i);
            if (parameter.isScoped && !_isNested(parameter._type)) {
                role.compValues[_key(targetAddress, selector, i)] = _compress(
                    parameter
                );
            }
        }

        ScopeConfig.store(
            role.functions[_key(targetAddress, selector)],
            buffer
        );

        emit ScopeFunction(
            roleId,
            targetAddress,
            selector,
            parameters,
            options
        );
    }

    function _loadParameterConfig(
        address targetAddress,
        bytes4 selector,
        Role storage role,
        BitmapBuffer memory scopeConfig
    ) internal view returns (ParameterConfig[] memory result) {
        (uint256 left, uint256 right) = Topology.rootBounds(scopeConfig);
        result = new ParameterConfig[](right - left + 1);
        for (uint256 i = left; i <= right; ++i) {
            result[i] = _loadParameterConfig(
                targetAddress,
                selector,
                role,
                scopeConfig,
                i
            );
        }
    }

    function _loadParameterConfig(
        address targetAddress,
        bytes4 selector,
        Role storage role,
        BitmapBuffer memory scopeConfig,
        uint256 index
    ) internal view returns (ParameterConfig memory result) {
        (
            bool isScoped,
            ParameterType paramType,
            Comparison paramComp
        ) = ScopeConfig.unpackParameter(scopeConfig, index);

        result.isScoped = isScoped;
        result._type = paramType;
        result.comp = paramComp;

        if (_isNested(paramType)) {
            (uint256 left, uint256 right) = Topology.childrenBounds(
                scopeConfig,
                index
            );

            if (left <= right) {
                result.children = new ParameterConfig[](right - left + 1);
                for (uint256 j = left; j <= right; j++) {
                    result.children[j - left] = _loadParameterConfig(
                        targetAddress,
                        selector,
                        role,
                        scopeConfig,
                        j
                    );
                }
            }
        } else {
            result.compValues = role.compValues[
                _key(targetAddress, selector, uint8(index))
            ];
        }
    }

    function _key(
        address targetAddress,
        bytes4 selector
    ) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(targetAddress, selector));
    }

    function _key(
        address targetAddress,
        bytes4 selector,
        uint8 index
    ) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(targetAddress, selector, index));
    }

    function _compress(
        ParameterConfigFlat memory config
    ) private pure returns (bytes32[] memory) {
        if (config.comp == Comparison.SubsetOf) {
            assert(config.compValues.length == 1);
            return _splitCompValue(config._type, config.compValues[0]);
        } else {
            return _compressCompValues(config._type, config.compValues);
        }
    }

    function _compressCompValues(
        ParameterType paramType,
        bytes[] memory compValues
    ) private pure returns (bytes32[] memory result) {
        result = new bytes32[](compValues.length);
        for (uint256 i; i < compValues.length; ++i) {
            result[i] = paramType == ParameterType.Static
                ? bytes32(compValues[i])
                : keccak256(compValues[i]);
        }
    }

    function _splitCompValue(
        ParameterType paramType,
        bytes memory compValue
    ) private pure returns (bytes32[] memory) {
        assert(paramType == ParameterType.Dynamic32);

        uint256 length = compValue.length / 32;
        bytes32[] memory result = new bytes32[](length);

        uint256 offset = 32;
        for (uint256 i; i < length; ++i) {
            bytes32 chunk;
            assembly {
                chunk := mload(add(compValue, offset))
            }
            result[i] = chunk;
            offset += 32;
        }

        return result;
    }
}
