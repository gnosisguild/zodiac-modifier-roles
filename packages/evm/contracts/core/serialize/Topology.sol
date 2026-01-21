// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title TopologyLib
 * @notice Analyzes condition trees to extract structure and type information
 *         needed for serialization and validation.
 *
 * @dev    Conditions arrive in BFS order, so a single backward pass lets us
 *         bubble up child properties to parents in O(N) time, avoiding
 *         expensive redundant traversals.
 *
 * @author gnosisguild
 */
library TopologyLib {
    function resolve(
        ConditionFlat[] memory conditions
    ) internal pure returns (Topology[] memory topology) {
        /*
         * Note: This function assumes input conditions satisfy Integrity rules.
         * Most notably, within any child collection, structural nodes must
         * precede non-structural ones for correct serialization.
         */
        _validateBFS(conditions);

        topology = new Topology[](conditions.length);

        for (uint256 i = conditions.length; i > 0; ) {
            ConditionFlat memory condition = conditions[--i];

            bool isLogical = condition.operator == Operator.And ||
                condition.operator == Operator.Or;

            Encoding e = condition.paramType;
            bool isStructural = e == Encoding.Static ||
                e == Encoding.Dynamic ||
                e == Encoding.Tuple ||
                e == Encoding.Array ||
                e == Encoding.AbiEncoded;

            Topology memory parent = topology[condition.parent];
            Topology memory current = topology[i];

            if (
                e == Encoding.Dynamic ||
                e == Encoding.Array ||
                e == Encoding.AbiEncoded
            ) {
                current.isNotInline = true;
            }

            /*
             *
             * Bubble Up. Skip for Root
             *
             */
            if (i > 0) {
                parent.childStart = i;
                parent.childCount++;

                // A child is structurally meaningful if it has structural
                // encoding or has structural descendants
                if (isStructural || current.sChildCount > 0) {
                    parent.sChildCount++;
                }

                if (current.isNotInline) {
                    parent.isNotInline = true;
                }
            }

            uint256 childStart = current.childStart;

            /*
             * isVariant
             *
             * Arrays and Logical nodes can be variant. For these container
             * types, we compare their children's type hashes to determine
             * if they are variants.
             */
            if ((e == Encoding.Array || isLogical) && current.sChildCount > 1) {
                bytes32 childHash = topology[childStart].typeHash;
                for (uint256 j = 1; j < current.sChildCount; ++j) {
                    if (childHash != topology[childStart + j].typeHash) {
                        current.isVariant = true;
                        break;
                    }
                }
            }

            /*
             * Non-variant logical nodes are transparent in the layout. Since all
             * children share the same type, only the first contributes - exclude
             * the rest. Same idea for typeHash.
             */
            if (isLogical && !current.isVariant) {
                for (uint256 j = 1; j < current.childCount; ++j) {
                    _excludeFromLayout(topology, childStart + j);
                }
                current.typeHash = topology[childStart].typeHash;
                continue;
            }

            /*
             * isInLayout
             *
             * Structural nodes and Logical Variant nodes are in layout.
             * (Logical Non-variant were handled above).
             */
            current.isInLayout =
                (isLogical && current.isVariant) ||
                isStructural;

            /*
             * typeHash
             *
             * Computes a unique hash representing the node's type structure.
             * Used to detect whether siblings share the same type (for isVariant).
             *
             * The hash combines: encoding type, leadingBytes (for AbiEncoded),
             * and children's type hashes. Non-variant arrays use only the first
             * child as a template since all elements share the same type.
             */
            bytes32 hash = bytes32(uint256(e)) |
                (
                    e == Encoding.AbiEncoded
                        ? _leadingBytes(condition) << 8
                        : bytes32(0)
                );

            uint256 childHashCount = e == Encoding.Array && !current.isVariant
                ? 1
                : current.sChildCount;

            /*
             * Computes hash which is a composite of all child hashes.
             */
            for (uint256 j; j < childHashCount; ++j) {
                hash = keccak256(
                    abi.encodePacked(hash, topology[childStart + j].typeHash)
                );
            }
            current.typeHash = hash;
        }
    }

    function _validateBFS(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;
        if (length == 0 || conditions[0].parent != 0) {
            revert IRolesError.UnsuitableRootNode();
        }

        for (uint256 i = 1; i < length; ++i) {
            uint256 parent = conditions[i].parent;
            if (parent == i) {
                revert IRolesError.UnsuitableRootNode();
            }
            // Parent must have lower index (no forward references)
            if (parent < conditions[i - 1].parent) {
                revert IRolesError.NotBFS();
            }
            // Parent cannot be higher than self
            if (parent >= i) {
                revert IRolesError.NotBFS();
            }
        }
    }

    function _excludeFromLayout(
        Topology[] memory topology,
        uint256 index
    ) private pure {
        Topology memory entry = topology[index];
        entry.isInLayout = false;

        for (uint256 i; i < entry.childCount; ++i) {
            _excludeFromLayout(topology, entry.childStart + i);
        }
    }

    function _leadingBytes(
        ConditionFlat memory condition
    ) private pure returns (bytes32) {
        bytes memory compValue = condition.compValue;
        uint256 result = compValue.length == 0
            ? 4
            : uint256(uint16(bytes2(compValue)));
        return bytes32(result);
    }
}
