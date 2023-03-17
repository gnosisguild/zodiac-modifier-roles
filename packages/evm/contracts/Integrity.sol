// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library Integrity {
    error NoRootNodeFound();

    error MultipleRootNodesFound();

    error FlatButNotBFS();

    error UnsuitableParent(uint256 index);

    error UnsuitableOperator(uint256 index);

    error UnsuitableType(uint256 index);

    error UnsuitableRelativeOperator();

    error UnsuitableSubsetOfOperator();

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    error NoCompValuesProvidedForScope();

    error TooManyCompValuesForScope();

    error InvalidOperator();

    error NotEnoughChildren(uint256 index);

    error MalformedBitmask(uint256 index);

    error UnsuitableOperatorForTypeNone(uint256 index);

    function validate(ConditionFlat[] memory parameters) internal pure {
        root(parameters);
        topology(parameters);

        for (uint256 i = 0; i < parameters.length; ++i) {
            content(parameters[i], i);
        }
    }

    function root(ConditionFlat[] memory parameters) internal pure {
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

    function topology(ConditionFlat[] memory parameters) private pure {
        // this function will be optimized

        uint256 length = parameters.length;
        // check BFS
        for (uint256 i = 1; i < length; ++i) {
            if (parameters[i - 1].parent > parameters[i].parent) {
                revert FlatButNotBFS();
            }
        }

        for (uint256 i = 0; i < length; ++i) {
            if (
                parameters[i].operator == Operator.EthWithinAllowance &&
                parameters[parameters[i].parent].paramType !=
                ParameterType.AbiEncoded
            ) {
                revert UnsuitableParent(i);
            }
        }

        // check at least 2 children for relational nodes
        for (uint256 i = 0; i < parameters.length; i++) {
            if (parameters[i].operator == Operator.Or) {
                if (parameters[i].compValue.length != 0) {
                    revert InvalidOperator();
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
        ConditionFlat memory parameter,
        uint256 index
    ) internal pure {
        bytes memory compValue = parameter.compValue;
        Operator comp = parameter.operator;
        ParameterType _type = parameter.paramType;

        if (
            _type == ParameterType.None &&
            !(comp == Operator.Or ||
                comp == Operator.And ||
                comp == Operator.EthWithinAllowance)
        ) {
            revert UnsuitableOperator(index);
        }

        if (
            (comp == Operator.Or ||
                comp == Operator.And ||
                comp == Operator.EthWithinAllowance) &&
            _type != ParameterType.None
        ) {
            revert UnsuitableType(index);
        }

        if (
            (comp == Operator.GreaterThan || comp == Operator.LessThan) &&
            _type != ParameterType.Static
        ) {
            revert UnsuitableRelativeOperator();
        }

        if (
            (comp == Operator.EqualTo ||
                comp == Operator.GreaterThan ||
                comp == Operator.LessThan) &&
            _type == ParameterType.Static &&
            compValue.length != 32
        ) {
            revert UnsuitableStaticCompValueSize();
        }

        if (comp == Operator.Bitmask) {
            if (compValue.length != 32) {
                revert MalformedBitmask(index);
            }
        }
    }
}
