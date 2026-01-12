// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/ImmutableStorage.sol";

import "./ConditionPacker.sol";
import "./ConditionTransform.sol";
import "./Integrity.sol";
import "./Topology.sol";
import "./TypeTree.sol";

import "../../types/Types.sol";

/**
 * @title ConditionStorer
 * @notice Validates, transforms, and stores condition trees into immutable
 *         storage.
 *
 * @author gnosisguild
 */
library ConditionStorer {
    /**
     * @notice Validates, transforms, packs, and stores a condition tree.
     *
     * @param conditions The flat condition array in BFS order.
     * @param options Execution options (Send, DelegateCall, Both, None).
     * @return scopeConfig Packed scope config (options << 160 | pointer).
     */
    function store(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) external returns (uint256 scopeConfig) {
        Integrity.enforce(conditions);

        ConditionTransform.transform(conditions);

        Layout memory layout;
        if (Topology.isStructural(conditions, 0)) {
            layout = TypeTree.inspect(conditions, 0);
        }

        bytes memory buffer = ConditionPacker.pack(conditions, layout);
        address pointer = ImmutableStorage.store(buffer);

        return (uint256(options) << 160) | uint160(pointer);
    }
}
