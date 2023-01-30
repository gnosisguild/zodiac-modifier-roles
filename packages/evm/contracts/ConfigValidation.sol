// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library ConfigValidation {
    /// Not possible to define gt/lt for Dynamic types
    error ConfigTopologyNotBFS(uint256 index);

    /// Not possible to define gt/lt for Dynamic types
    error UnsuitableRelativeComparison();

    error UnsuitableSubsetOfComparison();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    /// CompValue for Dynamic32 types should be a multiple of exactly 32 bytes
    error UnsuitableDynamic32CompValueSize();

    error NoCompValuesProvidedForScope();

    error NotEnoughCompValuesForScope();

    error TooManyCompValuesForScope();

    function check(ParameterConfigFlat[] calldata parameters) internal pure {
        for (uint256 i = 1; i < parameters.length; ++i) {
            if (parameters[i - 1].parent > parameters[i].parent) {
                revert ConfigTopologyNotBFS(i);
            }
        }

        topology(parameters);

        for (uint256 i = 0; i < parameters.length; ++i) {
            entry(parameters[i]);
        }
    }

    function topology(ParameterConfigFlat[] calldata parameters) private pure {
        // TODO check that array and tuple-oneOf nodes are topologically equivalent
    }

    function entry(ParameterConfigFlat calldata parameter) internal pure {
        if (!parameter.isScoped || _isNested(parameter._type)) {
            return;
        }

        bytes[] calldata compValues = parameter.compValues;
        if (parameter.compValues.length == 0) {
            revert NoCompValuesProvidedForScope();
        }

        Comparison comp = parameter.comp;
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

        ParameterType _type = parameter._type;
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
            if (_type == ParameterType.Static && compValues[i].length != 32) {
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
