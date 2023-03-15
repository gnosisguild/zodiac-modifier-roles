// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library Topology {
    function typeTree(
        ParameterConfig memory parameter
    ) internal pure returns (TypeTopology memory result) {
        if (
            parameter.comp == Comparison.And || parameter.comp == Comparison.Or
        ) {
            return typeTree(parameter.children[0]);
        }

        result._type = parameter._type;
        if (parameter.children.length > 0) {
            uint256 length = parameter.children.length;

            result.children = new TypeTopology[](length);
            for (uint256 i; i < length; ) {
                result.children[i] = typeTree(parameter.children[i]);
                unchecked {
                    ++i;
                }
            }
        }
    }
}
