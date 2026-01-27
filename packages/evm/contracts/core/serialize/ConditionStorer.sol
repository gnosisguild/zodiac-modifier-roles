// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/ImmutableStorage.sol";

import "./ConditionPacker.sol";
import "./Integrity.sol";

import "../../types/Types.sol";

/**
 * @title ConditionStorer
 * @notice Validates and stores condition trees in immutable storage.
 *
 * @author gnosisguild
 */
library ConditionStorer {
    /**
     * @notice Validates and packs a condition tree into bytes.
     *
     * @param conditions The flat condition array in BFS order.
     * @return buffer The packed condition buffer.
     */
    function pack(
        ConditionFlat[] memory conditions
    ) external pure returns (bytes memory buffer) {
        Integrity.enforce(conditions);
        return ConditionPacker.pack(conditions);
    }

    /**
     * @notice Stores a pre-packed condition buffer.
     *
     * @param buffer The packed condition buffer (from pack()).
     * @param options Execution options (Send, DelegateCall, Both, None).
     * @return scopeConfig Packed scope config (options << 160 | pointer).
     */
    function store(
        bytes memory buffer,
        ExecutionOptions options
    ) external returns (uint256 scopeConfig) {
        address pointer = ImmutableStorage.store(buffer);
        return (uint256(options) << 160) | uint160(pointer);
    }
}
