// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Consumption} from "../types/Allowance.sol";

/**
 * @title ConsumptionList
 * @notice Provides copy-on-write array operations for Consumption entries.
 *
 * @author gnosisguild
 */
library ConsumptionList {
    /**
     * @notice Creates a new array with entry written at index.
     * @dev If index equals array length, the array grows by one.
     * @param list Source array (shallow copied)
     * @param entry The consumption entry to write
     * @param index Position to write entry
     * @return result New array with entry at index
     */
    function copyOnWrite(
        Consumption[] memory list,
        Consumption memory entry,
        uint256 index
    ) internal pure returns (Consumption[] memory result) {
        uint256 prevLength = list.length;
        uint256 length = prevLength + (index == prevLength ? 1 : 0);

        assembly {
            // Allocate new array
            result := mload(0x40)
            mstore(0x40, add(result, mul(add(length, 1), 0x20)))
            mstore(result, length)

            // Shallow copy previous elements
            let dst := add(result, 0x20)
            let src := add(list, 0x20)
            let size := mul(prevLength, 0x20)
            mcopy(dst, src, size)
        }

        result[index] = entry;
    }
}
