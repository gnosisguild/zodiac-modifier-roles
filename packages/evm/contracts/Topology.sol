// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title Topology - a library that provides helper functions for dealing with
 * the flat representation of conditions.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Topology {
    struct Bounds {
        uint256 start;
        uint256 end;
        uint256 length;
    }

    function childrenBounds(
        ConditionFlat[] memory conditions
    ) internal pure returns (Bounds[] memory result) {
        uint256 count = conditions.length;
        assert(count > 0);

        // parents are breadth-first
        result = new Bounds[](count);
        result[0].start = type(uint256).max;

        // first item is the root
        for (uint256 i = 1; i < count; ) {
            result[i].start = type(uint256).max;
            Bounds memory parentBounds = result[conditions[i].parent];
            if (parentBounds.start == type(uint256).max) {
                parentBounds.start = i;
            }
            parentBounds.end = i + 1;
            parentBounds.length = parentBounds.end - parentBounds.start;
            unchecked {
                ++i;
            }
        }
    }

    function typeTree(
        ConditionFlat[] memory conditions,
        uint256 entrypoint,
        Bounds[] memory bounds
    ) internal pure returns (AbiTypeTree[] memory result) {
        result = new AbiTypeTree[](conditions.length - entrypoint);
        uint256 length = typeTree(conditions, bounds, entrypoint, 0, result);

        if (length != conditions.length - entrypoint) {
            assembly {
                mstore(result, length)
            }
        }
    }

    function typeTree(
        ConditionFlat[] memory conditions,
        Bounds[] memory bounds,
        uint256 from,
        uint256 to,
        AbiTypeTree[] memory result
    ) internal pure returns (uint256) {
        AbiType _type = conditions[from].paramType;
        Operator operator = conditions[from].operator;
        uint256 start = bounds[from].start;
        uint256 end = bounds[from].end;
        bool hasChildren = start < end;

        if (operator >= Operator.And && operator <= Operator.Nor) {
            return typeTree(conditions, bounds, start, to, result);
        }

        result[to]._type = _type;
        if (!hasChildren) {
            return (to + 1);
        }

        end = _type == AbiType.Array ? start + 1 : end;
        uint256[] memory fields = new uint256[](end - start);

        (uint256 nextTo, uint256 length) = (to + 1, 0);
        for (from = start; from < end; from++) {
            uint256 temp = typeTree(conditions, bounds, from, nextTo, result);
            if (nextTo != temp) {
                fields[length] = nextTo;
                nextTo = temp;
                length++;
            }
        }

        result[to].fields = fields;
        if (length != end - start) {
            assembly {
                mstore(fields, length)
            }
        }

        return nextTo;
    }
}
