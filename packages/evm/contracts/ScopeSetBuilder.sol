// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./FunctionConfig.sol";
import "./Types.sol";

abstract contract ScopeSetBuilder is Modifier {
    uint256 internal constant SCOPE_MAX_PARAMS = 48;

    /// Not possible to define gt/lt for Dynamic types
    error UnsuitableRelativeComparison();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    /// CompValue for Dynamic32 types should be a multiple of exactly 32 bytes
    error UnsuitableDynamic32CompValueSize();

    /// Exceeds the max number of params supported
    error ScopeMaxParametersExceeded();

    error NoCompValuesProvidedForScope();

    error NotEnoughCompValuesForScope();

    error TooManyCompValuesForScope();

    mapping(uint16 => ScopeSet) internal scopeSets;

    /// @dev Allows a specific function signature on a scoped target.
    /// @notice Only callable by owner.
    /// @param scopeSetId Role to set for
    /// @param selector Function signature to be allowed.
    /// @param options Defines whether or not delegate calls and/or eth can be sent to the function.
    function allowFunction_(
        uint16 scopeSetId,
        bytes4 selector,
        ExecutionOptions options
    ) public onlyOwner {
        ScopeSet storage scopeSet = scopeSets[scopeSetId];
        if (!scopeSet.created) {
            scopeSet.created = true;
        }
        scopeSet.functions[selector] = FunctionConfig.pack(0, options, true, 0);
    }

    /// @dev Disallows a specific function signature on a scoped target.
    /// @notice Only callable by owner.
    /// @param scopeSetId Role to set for
    /// @param selector Function signature to be disallowed.
    function revokeFunction_(
        uint16 scopeSetId,
        bytes4 selector
    ) public onlyOwner {
        delete scopeSets[scopeSetId].functions[selector];
    }

    /// @dev Sets scoping rules for a function, on a scoped address.
    /// @notice Only callable by owner.
    /// @param scopeSetId ScopeSet to augment.
    /// @param selector Function signature to be scoped.
    /// @param parameters parameter configuration
    /// @param options Defines whether or not delegate calls and/or eth can be sent to the function.
    function scopeFunction_(
        uint16 scopeSetId,
        bytes4 selector,
        ParameterConfig[] calldata parameters,
        ExecutionOptions options
    ) public onlyOwner {
        if (parameters.length > SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        for (uint256 i = 0; i < parameters.length; i++) {
            if (parameters[i].isScoped) {
                enforceComp(parameters[i]);
                enforceCompValue(parameters[i]);
            }
        }

        ScopeSet storage scopeSet = scopeSets[scopeSetId];
        if (!scopeSet.created) {
            scopeSet.created = true;
        }

        /*
         * pack(
         *    0           -> start from a fresh fnConfig
         *    options     -> externally provided options
         *    false       -> mark the function as not wildcarded
         *    length      -> parameter count
         * )
         */
        uint256 fnConfig = FunctionConfig.pack(
            0,
            options,
            false,
            parameters.length
        );
        for (uint256 i = 0; i < parameters.length; i++) {
            ParameterConfig calldata parameter = parameters[i];
            if (!parameter.isScoped) {
                continue;
            }
            fnConfig = FunctionConfig.packParameter(
                fnConfig,
                i,
                parameter.isScoped,
                parameter._type,
                parameter.comp
            );

            bytes32 key = keyForCompValues(selector, i);
            bytes[] calldata compValues = parameter.compValues;
            assert(compValues.length > 0);

            scopeSet.compValues[key] = new bytes32[](compValues.length);
            for (uint256 j = 0; j < compValues.length; j++) {
                scopeSet.compValues[key][j] = compressCompValue(
                    parameter._type,
                    parameter.compValues[j]
                );
            }
        }
        scopeSet.functions[selector] = fnConfig;
    }

    /// @dev Internal function that enforces a comparison type is valid.
    /// @param config  provides information about the type of parameter and the type of comparison.
    function enforceComp(ParameterConfig calldata config) private pure {
        bool isRelative = config.comp != Comparison.EqualTo &&
            config.comp != Comparison.OneOf;

        if ((config._type != ParameterType.Static) && isRelative) {
            revert UnsuitableRelativeComparison();
        }
    }

    /// @dev Internal function that enforces a param type is valid.
    /// @param config  provides information about the type of parameter and the type of comparison.
    function enforceCompValue(ParameterConfig calldata config) private pure {
        assert(config.isScoped);

        if (config.compValues.length == 0) {
            revert NoCompValuesProvidedForScope();
        }

        if (config.comp == Comparison.OneOf) {
            if (config.compValues.length < 2) {
                revert NotEnoughCompValuesForScope();
            }
        } else {
            if (config.compValues.length != 1) {
                revert TooManyCompValuesForScope();
            }
        }

        for (uint256 i = 0; i < config.compValues.length; i++) {
            if (
                config._type == ParameterType.Static &&
                config.compValues[i].length != 32
            ) {
                revert UnsuitableStaticCompValueSize();
            }

            if (
                config._type == ParameterType.Dynamic32 &&
                config.compValues[i].length % 32 != 0
            ) {
                revert UnsuitableDynamic32CompValueSize();
            }
        }
    }

    function keyForCompValues(
        bytes4 functionSig,
        uint256 index
    ) internal pure returns (bytes32) {
        assert(index <= type(uint8).max);
        return bytes32(abi.encodePacked(functionSig, uint8(index)));
    }

    function compressCompValue(
        ParameterType paramType,
        bytes memory compValue
    ) private pure returns (bytes32) {
        return
            paramType == ParameterType.Static
                ? bytes32(compValue)
                : keccak256(compValue);
    }
}
