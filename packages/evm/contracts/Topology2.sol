// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";
import "hardhat/console.sol";

/**
 * @title Topology - a library that provides helper functions for dealing with
 * the flat representation of conditions.
 *
 * @author gnosisguild
 */
library Topology2 {
    struct Result {
        AbiType _type;
        Result[] children;
    }

    function typeTree(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (Result memory result) {
        AbiType _type = conditions[index].paramType;

        Operator operator = conditions[index].operator;
        if (operator >= Operator.And && operator <= Operator.Nor) {
            return variant(conditions, index);
        }

        result._type = _type;
        (uint256 start, uint256 length) = _children(conditions, index);
        if (length > 0) {
            result.children = new Result[](_type == AbiType.Array ? 1 : length);
            for (uint256 i = 0; i < result.children.length; i++) {
                result.children[i] = typeTree(conditions, i + start);
            }
        }
    }

    function variant(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (Result memory result) {
        (uint256 childrenStart, uint256 childrenLength) = _children(
            conditions,
            index
        );
        assert(childrenStart > 0);

        // Check if this is a valid variant type structure
        (bool cantBeVariant, bool hasToBeVariant) = variantShortcut(
            conditions,
            childrenStart,
            childrenLength
        );

        if (cantBeVariant) {
            // Non-variant type found, return first element's tree
            return typeTree(conditions, childrenStart);
        }

        return
            variantResolve(
                conditions,
                childrenStart,
                childrenLength,
                hasToBeVariant
            );
    }

    function variantShortcut(
        ConditionFlat[] memory conditions,
        uint256 start,
        uint256 length
    ) internal pure returns (bool cantBeVariant, bool hasToBeVariant) {
        bool hasDynamic;
        bool hasCalldata;
        bool hasAbiEncoded;
        /*
         * We operate under the assumption that a condition tree reaching
         * this point has been validated for integrity
         */
        for (uint256 i = 0; i < length; i++) {
            AbiType paramType = conditions[start + i].paramType;

            if (paramType == AbiType.Dynamic) {
                hasDynamic = true;
            } else if (paramType == AbiType.Calldata) {
                hasCalldata = true;
            } else if (paramType == AbiType.AbiEncoded) {
                hasAbiEncoded = true;
            } else if (paramType != AbiType.None) {
                return (true, false);
            }
        }

        // Check if we have mixed types (which creates variants)
        uint256 typeCount = (hasDynamic ? 1 : 0) +
            (hasCalldata ? 1 : 0) +
            (hasAbiEncoded ? 1 : 0);

        return (false, typeCount > 1);
    }

    function variantResolve(
        ConditionFlat[] memory conditions,
        uint256 childrenStart,
        uint256 childrenLength,
        bool isVariant
    ) internal pure returns (Result memory result) {
        result._type = AbiType.Dynamic;
        result.children = new Result[](childrenLength);

        bytes32 id;
        for (uint256 i = 0; i < childrenLength; i++) {
            result.children[i] = typeTree(conditions, childrenStart + i);

            if (!isVariant) {
                bytes32 currentId = _typeTreeId(result.children[i]);

                if (id == 0) {
                    id = currentId;
                } else if (id != currentId) {
                    isVariant = true;
                }
            }
        }

        return isVariant ? result : result.children[0];
    }

    function _children(
        ConditionFlat[] memory conditions,
        uint256 index
    ) internal pure returns (uint256 start, uint256 length) {
        for (uint256 i = index + 1; i < conditions.length; i++) {
            uint256 parent = conditions[i].parent;
            if (parent == index) {
                if (start == 0) {
                    start = i;
                }
                length++;
            } else if (parent > index) {
                break;
            }
        }
    }

    function _typeTreeId(Result memory tree) private pure returns (bytes32) {
        uint256 childCount = tree.children.length;
        if (childCount == 0) {
            return bytes32(uint256(tree._type));
        }

        // For single child, avoid array allocation
        if (childCount == 1) {
            return
                keccak256(
                    abi.encodePacked(tree._type, _typeTreeId(tree.children[0]))
                );
        }

        // For small counts, unroll the loop
        if (childCount == 2) {
            return
                keccak256(
                    abi.encodePacked(
                        tree._type,
                        _typeTreeId(tree.children[0]),
                        _typeTreeId(tree.children[1])
                    )
                );
        }

        bytes32[] memory ids = new bytes32[](childCount);
        for (uint256 i = 0; i < childCount; ++i) {
            ids[i] = _typeTreeId(tree.children[i]);
        }
        return keccak256(abi.encodePacked(tree._type, ids));
    }
}
