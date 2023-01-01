// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./FunctionConfig.sol";
import "./Types.sol";

abstract contract ScopeSetBuilder is Modifier {
    uint256 internal constant SCOPE_MAX_PARAMS = 48;

    /// Arrays must be the same length
    error ArraysDifferentLength();

    /// OneOf Comparison must be set via dedicated function
    error UnsuitableOneOfComparison();

    /// Not possible to define gt/lt for Dynamic types
    error UnsuitableRelativeComparison();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    /// CompValue for Dynamic32 types should be a multiple of exactly 32 bytes
    error UnsuitableDynamic32CompValueSize();

    /// Exceeds the max number of params supported
    error ScopeMaxParametersExceeded();

    /// OneOf Comparison requires at least two compValues
    error NotEnoughCompValuesForOneOf();

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
    /// @param isScoped false for un-scoped, true for scoped.
    /// @param paramType Static, Dynamic or Dynamic32, depending on the parameter type.
    /// @param paramComp Any, or EqualTo, GreaterThan, or LessThan, depending on comparison type.
    /// @param compValue The reference value used while comparing and authorizing.
    /// @param options Defines whether or not delegate calls and/or eth can be sent to the function.
    function scopeFunction_(
        uint16 scopeSetId,
        bytes4 selector,
        bool[] memory isScoped,
        ParameterType[] memory paramType,
        Comparison[] memory paramComp,
        bytes[] calldata compValue,
        ExecutionOptions options
    ) public onlyOwner {
        uint256 length = isScoped.length;

        if (
            length != paramType.length ||
            length != paramComp.length ||
            length != compValue.length
        ) {
            revert ArraysDifferentLength();
        }

        if (length > SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        for (uint256 i = 0; i < length; i++) {
            if (isScoped[i]) {
                enforceComp(paramType[i], paramComp[i]);
                enforceCompValue(paramType[i], compValue[i]);
            }
        }

        /*
         * pack(
         *    0           -> start from a fresh fnConfig
         *    options     -> externally provided options
         *    false       -> mark the function as not wildcarded
         *    length      -> length
         * )
         */
        uint256 fnConfig = FunctionConfig.pack(0, options, false, length);
        for (uint256 i = 0; i < length; i++) {
            fnConfig = FunctionConfig.packParameterRaw(
                fnConfig,
                i,
                isScoped[i],
                paramType[i],
                paramComp[i]
            );
        }

        ScopeSet storage scopeSet = scopeSets[scopeSetId];
        if (!scopeSet.created) {
            scopeSet.created = true;
        }

        //set fnConfig
        scopeSet.functions[selector] = fnConfig;

        //set compValues
        for (uint256 i = 0; i < length; i++) {
            scopeSet.compValues[
                keyForCompValues(selector, i)
            ] = compressCompValue(paramType[i], compValue[i]);
        }
    }

    /// @dev Sets and enforces scoping rules, for a single parameter of a function, on a scoped target.
    /// @notice Only callable by owner.
    /// @notice Parameter will be scoped with comparison type OneOf.
    /// @param scopeSetId ScopeSet to augment.
    /// @param selector Function signature to be scoped.
    /// @param index The index of the parameter to scope.
    /// @param paramType Static, Dynamic or Dynamic32, depending on the parameter type.
    /// @param compValues The reference values used while comparing and authorizing.
    function scopeParameterAsOneOf_(
        uint16 scopeSetId,
        bytes4 selector,
        uint256 index,
        ParameterType paramType,
        bytes[] calldata compValues
    ) public onlyOwner {
        if (index >= SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        if (compValues.length < 2) {
            revert NotEnoughCompValuesForOneOf();
        }

        for (uint256 i = 0; i < compValues.length; i++) {
            enforceCompValue(paramType, compValues[i]);
        }

        ScopeSet storage scopeSet = scopeSets[scopeSetId];
        if (!scopeSet.created) {
            scopeSet.created = true;
        }

        // set fnConfig
        uint256 fnConfig = FunctionConfig.packParameter(
            scopeSet.functions[selector],
            index,
            true, // isScoped
            paramType,
            Comparison.OneOf
        );
        scopeSet.functions[selector] = fnConfig;

        // set compValue
        bytes32 key = keyForCompValues(selector, index);
        scopeSet.compValuesOneOf[key] = new bytes32[](compValues.length);
        for (uint256 i = 0; i < compValues.length; i++) {
            scopeSet.compValuesOneOf[key][i] = compressCompValue(
                paramType,
                compValues[i]
            );
        }
    }

    /// @dev Internal function that enforces a comparison type is valid.
    /// @param paramType provides information about the type of parameter.
    /// @param paramComp the type of comparison for each parameter.
    function enforceComp(
        ParameterType paramType,
        Comparison paramComp
    ) private pure {
        if (paramComp == Comparison.OneOf) {
            revert UnsuitableOneOfComparison();
        }

        if (
            (paramType != ParameterType.Static) &&
            (paramComp != Comparison.EqualTo)
        ) {
            revert UnsuitableRelativeComparison();
        }
    }

    /// @dev Internal function that enforces a param type is valid.
    /// @param paramType provides information about the type of parameter.
    /// @param compValue the value to compare a param against.
    function enforceCompValue(
        ParameterType paramType,
        bytes memory compValue
    ) private pure {
        if (paramType == ParameterType.Static && compValue.length != 32) {
            revert UnsuitableStaticCompValueSize();
        }

        if (
            paramType == ParameterType.Dynamic32 && compValue.length % 32 != 0
        ) {
            revert UnsuitableDynamic32CompValueSize();
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
