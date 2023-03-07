// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library Integrity {
    error NoRootNodeFound();

    error MultipleRootNodesFound();

    error UnsuitableRootNode(uint256 index);

    error ConfigTopologyNotBFS(uint256 index);

    error UnsuitableRelativeComparison();

    error UnsuitableSubsetOfComparison();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    error NoCompValuesProvidedForScope();

    error TooManyCompValuesForScope();

    error MalformedOneOfComparison();

    error TooFewCompValuesForOneOf(uint256 index);

    error MalformedBitmask(uint256 index);

    function validate(ParameterConfigFlat[] calldata parameters) internal pure {
        root(parameters);
        topology(parameters);

        for (uint256 i = 0; i < parameters.length; ++i) {
            content(parameters[i], i);
        }
    }

    function root(ParameterConfigFlat[] calldata parameters) internal pure {
        uint256 index;
        uint256 count;

        for (uint256 i; i < parameters.length; ++i) {
            if (parameters[i].parent == i) {
                index = i;
                count++;
            }
        }
        if (count == 0) {
            revert NoRootNodeFound();
        }

        if (count > 1) {
            revert MultipleRootNodesFound();
        }

        ParameterConfigFlat calldata parameter = parameters[index];
        if (
            !(parameter._type == ParameterType.AbiEncoded &&
                (parameter.comp == Comparison.OneOf ||
                    parameter.comp == Comparison.Matches))
        ) {
            revert UnsuitableRootNode(index);
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
            if (parameters[i].comp == Comparison.OneOf) {
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
        // TODO a lot more integrity checks
    }

    function content(
        ParameterConfigFlat calldata parameter,
        uint256 index
    ) internal pure {
        if (
            parameter.comp == Comparison.Whatever || _isNested(parameter._type)
        ) {
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

        if (
            (comp == Comparison.EqualTo ||
                comp == Comparison.GreaterThan ||
                comp == Comparison.LessThan) &&
            _type == ParameterType.Static &&
            compValue.length != 32
        ) {
            revert UnsuitableStaticCompValueSize();
        }

        if (comp == Comparison.Bitmask) {
            if (compValue.length != 32) {
                revert MalformedBitmask(index);
            }
        }
    }

    function _isNested(ParameterType _type) private pure returns (bool) {
        return uint8(_type) >= uint8(ParameterType.Tuple);
    }
}
