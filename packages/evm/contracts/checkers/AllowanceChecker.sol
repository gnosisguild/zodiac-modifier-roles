// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../_Core.sol";
import "../AllowanceLoader.sol";
import "../types/All.sol";

/**
 * @title AllowanceChecker
 * @notice Validates and tracks allowance consumption
 * @dev Handles allowance accrual calculations and consumption checks.
 *
 * @author gnosisguild
 */
abstract contract AllowanceChecker is Core {
    function checkzzz(
        uint256 value,
        bytes32 allowanceKey,
        Consumption[] memory consumptions
    ) internal view returns (bool success, Consumption[] memory) {
        uint256 index;

        // Find in consumptions
        for (; index < consumptions.length; ++index) {
            if (consumptions[index].allowanceKey == allowanceKey) break;
        }

        uint128 balance;
        uint64 timestamp;
        uint128 consumed;
        if (index < consumptions.length) {
            balance = consumptions[index].balance;
            timestamp = consumptions[index].timestamp;
            consumed = consumptions[index].consumed;
        } else {
            (balance, timestamp) = AllowanceLoader.accrue(
                allowanceKey,
                uint64(block.timestamp)
            );
        }

        if (value + consumed > balance) {
            return (false, consumptions);
        }

        consumptions = _shallowClone(
            consumptions,
            index == consumptions.length
        );
        consumptions[index] = Consumption({
            allowanceKey: allowanceKey,
            balance: balance,
            consumed: consumed + uint128(value),
            timestamp: timestamp
        });

        return (true, consumptions);
    }

    /**
     * @dev Returns a shallow clone of `consumptions`. If `extend` is true,
     * the new array has length + 1.
     */
    function _shallowClone(
        Consumption[] memory consumptions,
        bool extend
    ) private pure returns (Consumption[] memory result) {
        uint256 prevLength = consumptions.length;
        uint256 nextLength = prevLength + (extend ? 1 : 0);

        assembly {
            result := mload(0x40)
            mstore(0x40, add(result, mul(add(nextLength, 1), 0x20)))

            mstore(result, nextLength)

            let dst := add(result, 0x20)
            let src := add(consumptions, 0x20)
            let size := mul(prevLength, 0x20)
            mcopy(dst, src, size)
        }
    }
}
