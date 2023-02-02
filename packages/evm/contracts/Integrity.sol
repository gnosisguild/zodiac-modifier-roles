// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library Integrity {
    /// Not possible to define gt/lt for Dynamic types
    error ConfigTopologyNotBFS(uint256 index);

    /// Not possible to define gt/lt for Dynamic types
    error UnsuitableRelativeComparison();

    error UnsuitableSubsetOfComparison();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    error NoCompValuesProvidedForScope();

    error TooManyCompValuesForScope();

    error MalformedOneOfComparison();

    error TooFewCompValuesForOneOf(uint256 index);

    function validate(ParameterConfigFlat[] calldata parameters) internal pure {
        topology(parameters);

        for (uint256 i = 0; i < parameters.length; ++i) {
            entry(parameters[i]);
        }
    }

    function topology(ParameterConfigFlat[] calldata parameters) private pure {
        // this function will be optimized

        // check BFS
        for (uint256 i = 1; i < parameters.length; ++i) {
            if (parameters[i - 1].parent > parameters[i].parent) {
                revert ConfigTopologyNotBFS(i);
            }
        }

        // check at least 2 oneOf nodes
        for (uint256 i = 0; i < parameters.length; i++) {
            if (parameters[i]._type == ParameterType.OneOf) {
                if (parameters[i].compValue.length != 0) {
                    revert MalformedOneOfComparison();
                }

                uint256 count;
                for (
                    uint256 j = i + 1;
                    j < parameters.length && parameters[j].parent <= i;
                    j++
                ) {
                    if (parameters[j].parent == i) {
                        count++;
                    }
                }
                if (count < 2) {
                    revert TooFewCompValuesForOneOf(i);
                }
            }
        }

        // TODO check that Array and tuple-oneOf nodes are topologically equivalent
    }

    function entry(ParameterConfigFlat calldata parameter) internal pure {
        if (!parameter.isScoped || _isNested(parameter._type)) {
            return;
        }

        bytes calldata compValue = parameter.compValue;
        Comparison comp = parameter.comp;

        ParameterType _type = parameter._type;
        if (comp == Comparison.GreaterThan) {
            if (_type != ParameterType.Static) {
                revert UnsuitableRelativeComparison();
            }
        } else if (comp == Comparison.LessThan) {
            if (_type != ParameterType.Static) {
                revert UnsuitableRelativeComparison();
            }
        }

        if (_type == ParameterType.Static && compValue.length != 32) {
            revert UnsuitableStaticCompValueSize();
        }
    }
}
