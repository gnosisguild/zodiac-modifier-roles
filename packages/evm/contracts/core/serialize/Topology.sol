// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../types/Types.sol";

/**
 * @title Topology
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
library Topology {
    function resolve(
        ConditionFlat[] memory conditions
    ) internal pure returns (TopologyInfo[] memory info) {
        _validateRoot(conditions);
        _validateBFS(conditions);

        uint256 length = conditions.length;
        info = new TopologyInfo[](length);

        for (uint256 i = length; i > 0; ) {
            unchecked {
                --i;
            }

            Encoding enc = conditions[i].paramType;
            TopologyInfo memory parent = info[conditions[i].parent];
            TopologyInfo memory current = info[i];

            bool encodingIsStructural = enc != Encoding.None &&
                enc != Encoding.EtherValue;

            bool encodingAtOffset = enc == Encoding.Dynamic ||
                enc == Encoding.Array ||
                enc == Encoding.AbiEncoded;

            /*
             * Distinguish between local and inherited properties. Because we
             * traverse backwards, `current.isStructural` and `current.atOffset`
             * may have already been set by descendants. We now merge the
             * node's own encoding properties into these propagated states.
             */
            if (encodingIsStructural) {
                current.isStructural = true;
            }

            if (encodingAtOffset) {
                current.atOffset = true;
            }

            if (i > 0) {
                // Bubble up. Skip for root
                parent.childStart = i;
                parent.childCount++;

                if (current.isStructural) {
                    parent.isStructural = true;
                    parent.sChildCount++;
                }

                if (current.atOffset) {
                    parent.atOffset = true;
                }
            }

            // Base hash: encoding (+ leadingBytes for AbiEncoded)
            bytes32 hash;
            if (enc == Encoding.AbiEncoded) {
                bytes memory compValue = conditions[i].compValue;
                uint256 leadingBytes = compValue.length == 0
                    ? 4
                    : uint256(uint16(bytes2(compValue)));
                hash = bytes32((leadingBytes << 8) | uint256(enc));
            } else {
                hash = bytes32(uint256(enc));
            }

            if (current.sChildCount == 0) {
                // Leaf: typeHash = baseHash (or 0 for None/EtherValue)
                if (encodingIsStructural) {
                    current.typeHash = hash;
                }
                continue;
            }

            // Detect variance in structural children types (setting `isVariant` if mixed).
            bytes32 firstHash;
            uint256 childCount = current.childCount;
            uint256 childStart = current.childStart;
            for (uint256 k; k < childCount; ++k) {
                TopologyInfo memory child = info[childStart + k];
                if (child.isStructural) {
                    if (firstHash == bytes32(0)) {
                        firstHash = child.typeHash;
                    } else if (firstHash != child.typeHash) {
                        current.isVariant = true;
                        break;
                    }
                }
            }

            // transparent operators: inherit first child's typeHash (or 0 if variant)
            if (!encodingIsStructural && !current.isVariant) {
                current.typeHash = firstHash;
                continue;
            }

            if (current.isVariant) {
                current.typeHash = bytes32(uint256(Encoding.Dynamic));
                continue;
            }

            for (uint256 k; k < childCount; ++k) {
                TopologyInfo memory child = info[childStart + k];
                if (child.isStructural) {
                    hash = keccak256(abi.encodePacked(hash, child.typeHash));
                }
            }
            current.typeHash = hash;
        }
    }

    function _validateBFS(ConditionFlat[] memory conditions) private pure {
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
}
