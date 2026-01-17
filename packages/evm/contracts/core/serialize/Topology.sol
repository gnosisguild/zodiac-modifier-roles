// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title TopologyLib
 * @notice Computes structural metadata and type information for condition trees.
 *         This pre-computed analysis is used by other libraries for validation
 *         and serialization.
 *
 * @dev    Achieves O(N) efficiency by doing a single backward pass over the BFS
 *         ordered data to bubble up properties. This is a significant
 *         improvement over the previous redundant and recursive approach.
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
         * precede non-structural ones for correct serialization alignment.
         */
        _validateBFS(conditions);

        uint256 length = conditions.length;
        bytes32[] memory typeHashes = new bytes32[](length);
        topology = new Topology[](length);

        for (uint256 i = length; i > 0; ) {
            unchecked {
                --i;
            }

            ConditionFlat memory condition = conditions[i];

            bool isLogical = condition.operator == Operator.And ||
                condition.operator == Operator.Or;

            Encoding e = condition.paramType == Encoding.EtherValue
                ? Encoding.None
                : condition.paramType;
            bool isStructural = e != Encoding.None;

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

            /*
             * isVariant
             *
             * Arrays and Logical nodes can be variant. For these container
             * types, we compare their children's type hashes to determine
             * if they are variants.
             */
            if ((e == Encoding.Array || isLogical) && current.sChildCount > 1) {
                bytes32 childHash = typeHashes[current.childStart];
                for (uint256 j = 1; j < current.sChildCount; ++j) {
                    if (childHash != typeHashes[current.childStart + j]) {
                        current.isVariant = true;
                        break;
                    }
                }
            }

            /*
             * isInLayout
             *
             * Determines if this node occupies an entry in the resolved layout
             *
             * Logical nodes (AND/OR) are usually transparent to the data layout
             * unless they are 'variants' (holding mixed types), which forces a
             * dynamic layout wrapper.
             */
            current.isInLayout =
                isStructural ||
                (isLogical && current.isVariant);

            /*
             * typeHash
             */
            if (isLogical && !current.isVariant) {
                // if logic and non variant, take the first
                typeHashes[i] = typeHashes[current.childStart];
                _pruneUnreachable(topology, i, true);
                continue;
            }

            bytes32 hash = bytes32(uint256(e));
            if (e == Encoding.AbiEncoded) {
                hash |= (_leadingBytes(condition) << 8);
            }

            uint256 childHashCount = (e == Encoding.Array && !current.isVariant)
                ? 1
                : current.sChildCount;

            for (uint256 j; j < childHashCount; ++j) {
                hash = keccak256(
                    abi.encodePacked(hash, typeHashes[current.childStart + j])
                );
            }
            typeHashes[i] = hash;
        }
    }

    function _validateBFS(ConditionFlat[] memory conditions) private pure {
        _validateRoot(conditions);

        uint256 length = conditions.length;
        for (uint256 i = 1; i < length; ++i) {
            // Parent must have lower index (no forward references)
            if (conditions[i - 1].parent > conditions[i].parent) {
                revert IRolesError.NotBFS();
            }
            // Parent cannot be itself or higher (except root at 0 which is handled separately)
            if (conditions[i].parent >= i) {
                revert IRolesError.NotBFS();
            }
        }
    }

    function _validateRoot(ConditionFlat[] memory conditions) private pure {
        // Must be exactly one root node (parent == itself), and it must be at index 0
        uint256 count;
        uint256 length = conditions.length;
        for (uint256 i = 0; i < length; ++i) {
            if (conditions[i].parent == i) ++count;
        }
        if (count != 1 || conditions[0].parent != 0) {
            revert IRolesError.UnsuitableRootNode();
        }
    }

    function _pruneUnreachable(
        Topology[] memory topology,
        uint256 index,
        bool entrypoint
    ) private pure {
        Topology memory current = topology[index];

        current.isInLayout = false;
        uint256 childCount = current.childCount;
        if (childCount == 0) return;
        uint256 childStart = current.childStart;

        for (uint256 i = entrypoint ? 1 : 0; i < childCount; ++i) {
            _pruneUnreachable(topology, childStart + i, false);
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
