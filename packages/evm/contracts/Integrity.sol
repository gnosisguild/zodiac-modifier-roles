// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library Integrity {
    error NoRootNodeFound();

    error MultipleRootNodesFound();

    error FlatButNotBFS();

    error UnsuitableComparison(uint256 index);

    error UnsuitableType(uint256 index);

    error UnsuitableRelativeComparison();

    error UnsuitableSubsetOfComparison();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    error NoCompValuesProvidedForScope();

    error TooManyCompValuesForScope();

    error InvalidComparison();

    error NotEnoughChildren(uint256 index);

    error MalformedBitmask(uint256 index);

    error UnsuitableComparisonForTypeNone(uint256 index);

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
    }

    function topology(ParameterConfigFlat[] calldata parameters) private pure {
        // this function will be optimized

        // check BFS
        for (uint256 i = 1; i < parameters.length; ++i) {
            if (parameters[i - 1].parent > parameters[i].parent) {
                revert FlatButNotBFS();
            }
        }

        // check at least 2 children for relational nodes
        for (uint256 i = 0; i < parameters.length; i++) {
            if (parameters[i].comp == Comparison.Or) {
                if (parameters[i].compValue.length != 0) {
                    revert InvalidComparison();
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
                    revert NotEnoughChildren(i);
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
        bytes calldata compValue = parameter.compValue;
        Comparison comp = parameter.comp;
        ParameterType _type = parameter._type;

        if (
            _type == ParameterType.None &&
            !(comp == Comparison.Or || comp == Comparison.And)
        ) {
            revert UnsuitableComparison(index);
        }

        if (
            (comp == Comparison.Or || comp == Comparison.And) &&
            _type != ParameterType.None
        ) {
            revert UnsuitableType(index);
        }

        if (
            (comp == Comparison.GreaterThan || comp == Comparison.LessThan) &&
            _type != ParameterType.Static
        ) {
            revert UnsuitableRelativeComparison();
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
}
