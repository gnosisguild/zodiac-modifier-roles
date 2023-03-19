// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";
import "./Topology.sol";

library Integrity {
    error NoRootNodeFound();

    error MultipleRootNodesFound();

    error FlatButNotBFS();

    error UnsuitableParent(uint256 index);

    error UnsuitableComparison(uint256 index);

    error UnsuitableType(uint256 index);

    error UnsuitableRelativeComparison();

    error UnsuitableSubsetOfComparison();

    error UnsuitableStaticCompValueSize();

    error UnsuitableChildTypeTree(uint256 index);

    error NoCompValuesProvidedForScope();

    error TooManyCompValuesForScope();

    error InvalidComparison();

    error NotEnoughChildren(uint256 index);

    error MalformedBitmask(uint256 index);

    error UnsuitableComparisonForTypeNone(uint256 index);

    function validate(ParameterConfigFlat[] memory parameters) internal pure {
        root(parameters);
        topology(parameters);

        for (uint256 i = 0; i < parameters.length; ++i) {
            content(parameters[i], i);
        }
    }

    function root(ParameterConfigFlat[] memory parameters) internal pure {
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

    function topology(ParameterConfigFlat[] memory parameters) private pure {
        uint256 length = parameters.length;
        // check BFS
        for (uint256 i = 1; i < length; ++i) {
            if (parameters[i - 1].parent > parameters[i].parent) {
                revert FlatButNotBFS();
            }
        }

        for (uint256 i = 0; i < length; ++i) {
            if (
                (parameters[i].comp == Comparison.ETHWithinAllowance ||
                    parameters[i].comp == Comparison.CallWithinAllowance) &&
                parameters[parameters[i].parent]._type !=
                ParameterType.AbiEncoded
            ) {
                revert UnsuitableParent(i);
            }
        }

        Topology.Bounds[] memory childrenBounds = Topology.childrenBounds(
            parameters
        );

        // check at least 2 children for relational nodes
        for (uint256 i = 0; i < parameters.length; i++) {
            ParameterConfigFlat memory parameter = parameters[i];
            if (
                parameter._type == ParameterType.None &&
                (parameter.comp == Comparison.Or ||
                    parameter.comp == Comparison.And)
            ) {
                if (parameter.compValue.length != 0) {
                    revert InvalidComparison();
                }

                if (childrenBounds[i].length < 2) {
                    revert NotEnoughChildren(i);
                }
            }
        }

        for (uint256 i = 0; i < parameters.length; i++) {
            ParameterConfigFlat memory parameter = parameters[i];
            if (
                parameter._type == ParameterType.None &&
                (parameter.comp == Comparison.Or ||
                    parameter.comp == Comparison.And)
            ) {
                // checkChildTypeTree(parameters, i, childrenBounds);
            }
        }

        // TODO check that Array and tuple-oneOf nodes are topologically equivalent
        // TODO a lot more integrity checks
        // TODO Extraneous can only be child of AbiEncoded or Tuple
        // TODO CallWithinAllowance must be direct child of AbiEncoded
        // TODO bitmask only for dynamic and static
        // TODO dynamic multiple of 32
    }

    function content(
        ParameterConfigFlat memory parameter,
        uint256 index
    ) internal pure {
        bytes memory compValue = parameter.compValue;
        Comparison comp = parameter.comp;
        ParameterType _type = parameter._type;

        if (
            _type == ParameterType.None &&
            !(comp == Comparison.Or ||
                comp == Comparison.And ||
                comp == Comparison.ETHWithinAllowance ||
                comp == Comparison.CallWithinAllowance)
        ) {
            revert UnsuitableComparison(index);
        }

        if (
            (comp == Comparison.Or ||
                comp == Comparison.And ||
                comp == Comparison.ETHWithinAllowance ||
                comp == Comparison.CallWithinAllowance) &&
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

    function checkChildTypeTree(
        ParameterConfigFlat[] memory parameters,
        uint256 index,
        Topology.Bounds[] memory childrenBounds
    ) private pure {
        uint256 start = childrenBounds[index].start;
        uint256 end = childrenBounds[index].end;

        bytes32 id = typeTreeId(parameters, start, childrenBounds);
        for (uint256 j = start + 1; j < end; ++j) {
            if (id != typeTreeId(parameters, j, childrenBounds)) {
                revert UnsuitableChildTypeTree(index);
            }
        }
    }

    function typeTreeId(
        ParameterConfigFlat[] memory parameters,
        uint256 index,
        Topology.Bounds[] memory childrenBounds
    ) private pure returns (bytes32) {
        Topology.Bounds memory bounds = childrenBounds[index];
        ParameterConfigFlat memory parameter = parameters[index];

        uint256 childrenCount = bounds.length;
        if (
            parameter.comp == Comparison.And || parameter.comp == Comparison.Or
        ) {
            assert(childrenCount >= 2);
            return typeTreeId(parameters, bounds.start, childrenBounds);
        }

        if (childrenCount > 0) {
            uint256 start = bounds.start;
            uint256 end = bounds.end;
            bytes32[] memory subIds = new bytes32[](childrenCount);
            for (uint256 i = start; i < end; ++i) {
                subIds[i - start] = typeTreeId(parameters, i, childrenBounds);
            }

            return keccak256(abi.encodePacked(parameter._type, "-", subIds));
        } else {
            return bytes32(uint256(parameter._type));
        }
    }
}
