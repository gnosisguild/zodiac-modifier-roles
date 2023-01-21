// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

import "./ParameterLayout.sol";
import "./ScopeConfig.sol";
import "./Types.sol";

abstract contract PermissionBuilder is OwnableUpgradeable {
    uint256 internal constant SCOPE_MAX_PARAMS = 32;

    /// Not possible to define gt/lt for Dynamic types
    error UnsuitableRelativeComparison();

    error UnsuitableSubsetOfComparison();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    /// CompValue for Dynamic32 types should be a multiple of exactly 32 bytes
    error UnsuitableDynamic32CompValueSize();

    /// Exceeds the max number of params supported
    error ScopeMaxParametersExceeded();

    error NoCompValuesProvidedForScope();

    error NotEnoughCompValuesForScope();

    error TooManyCompValuesForScope();

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
        roles[roleId].functions[_key(targetAddress, selector)] = ScopeConfig
            .pack(0, options, true, 0);

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
        delete roles[roleId].functions[_key(targetAddress, selector)];
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
        bytes memory key = abi.encodePacked(targetAddress, selector);

        for (uint256 i; i < parameters.length; ++i) {
            _enforceParameterConfig(parameters[i]);
        }

        _storeConfig(
            roles[roleId],
            key,
            parameters,
            options,
            ParameterLayout.rootBounds(parameters)
        );

        emit ScopeFunction(
            roleId,
            targetAddress,
            selector,
            parameters,
            options // TODO is there a need for the resulting scope config to be emitted?
        );
    }

    function _storeConfig(
        Role storage role,
        bytes memory key,
        ParameterConfigFlat[] memory parameters,
        ExecutionOptions options,
        Bounds memory bounds
    ) private {
        uint256 length = bounds.right - bounds.left + 1;
        uint256 scopeConfig = ScopeConfig.pack(0, options, false, length);

        uint256 iActual = bounds.left;
        for (uint256 i; i < length; ++i) {
            ParameterConfigFlat memory parameter = parameters[iActual];
            if (!parameter.isScoped) {
                ++iActual;
                continue;
            }

            scopeConfig = ScopeConfig.packParameter(
                scopeConfig,
                i,
                parameter.isScoped,
                parameter._type,
                parameter.comp
            );

            bytes memory childKey = abi.encodePacked(key, uint8(i));
            if (_isNested(parameter._type)) {
                (bool hasChildren, Bounds memory childBounds) = ParameterLayout
                    .childrenBounds(parameters, iActual);

                if (hasChildren)
                    _storeConfig(
                        role,
                        childKey,
                        parameters,
                        ExecutionOptions.None,
                        childBounds
                    );
            } else {
                role.compValues[keccak256(childKey)] = _compress(parameter);
            }
            ++iActual;
        }
        role.functions[keccak256(key)] = scopeConfig;
    }

    function _loadConfig(
        Role storage role,
        bytes memory key
    ) internal view returns (ParameterConfig[] memory result) {
        uint256 scopeConfig = role.functions[keccak256(key)];
        (, , uint256 length) = ScopeConfig.unpack(scopeConfig);

        result = new ParameterConfig[](length);
        for (uint256 i; i < length; ++i) {
            (
                bool isScoped,
                ParameterType paramType,
                Comparison paramComp
            ) = ScopeConfig.unpackParameter(scopeConfig, i);

            result[i].isScoped = isScoped;
            result[i]._type = paramType;
            result[i].comp = paramComp;
            if (!isScoped) {
                continue;
            }
            bytes memory childKey = abi.encodePacked(key, uint8(i));
            if (_isNested(paramType)) {
                result[i].children = _loadConfig(role, childKey);
            } else {
                result[i].compValues = role.compValues[keccak256(childKey)];
            }
        }
    }

    function _enforceParameterConfig(
        ParameterConfigFlat calldata config
    ) private pure {
        if (!config.isScoped) {
            return;
        }

        if (_isLeaf(config._type)) {
            bytes[] calldata compValues = config.compValues;
            if (config.compValues.length == 0) {
                revert NoCompValuesProvidedForScope();
            }

            Comparison comp = config.comp;
            if (
                comp == Comparison.EqualTo ||
                comp == Comparison.GreaterThan ||
                comp == Comparison.LessThan ||
                (comp == Comparison.SubsetOf)
            ) {
                if (compValues.length != 1) {
                    revert TooManyCompValuesForScope();
                }
            }

            ParameterType _type = config._type;
            // equal -> Static, Dynamic, Dynamic32
            // less -> Static
            // greater -> Static
            // oneOf -> Static, Dynamic, Dynamic32
            // subsetOf -> Dynamic32
            if (comp == Comparison.GreaterThan) {
                if (_type != ParameterType.Static) {
                    revert UnsuitableRelativeComparison();
                }
            } else if (comp == Comparison.LessThan) {
                if (_type != ParameterType.Static) {
                    revert UnsuitableRelativeComparison();
                }
            } else if (comp == Comparison.OneOf) {
                if (compValues.length < 2) {
                    revert NotEnoughCompValuesForScope();
                }
            } else if (comp == Comparison.SubsetOf) {
                if (_type != ParameterType.Dynamic32) {
                    revert UnsuitableSubsetOfComparison();
                }
            }

            for (uint256 i; i < compValues.length; ++i) {
                if (
                    _type == ParameterType.Static && compValues[i].length != 32
                ) {
                    revert UnsuitableStaticCompValueSize();
                }

                if (
                    _type == ParameterType.Dynamic32 &&
                    compValues[i].length % 32 != 0
                ) {
                    revert UnsuitableDynamic32CompValueSize();
                }
            }
        }
    }

    function _key(
        address targetAddress,
        bytes4 selector
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(targetAddress, selector));
    }

    function _isNested(ParameterType _type) private pure returns (bool) {
        return _type == ParameterType.Tuple || _type == ParameterType.Array;
    }

    function _isLeaf(ParameterType paramType) private pure returns (bool) {
        return
            paramType == ParameterType.Static ||
            paramType == ParameterType.Dynamic ||
            paramType == ParameterType.Dynamic32;
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
