// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../_Core.sol";
import "../AllowanceLoader.sol";
import "../Consumptions.sol";
import "../types/All.sol";

/**
 * @title AllowanceChecker
 * @notice Validates and tracks allowance consumption
 * @dev Handles allowance accrual calculations and consumption checks
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
        (consumptions, index) = _copyOnWrite(allowanceKey, consumptions);

        if (
            value + consumptions[index].consumed > consumptions[index].balance
        ) {
            return (false, consumptions);
        } else {
            consumptions[index].consumed += uint128(value);
            return (true, consumptions);
        }
    }

    function _copyOnWrite(
        bytes32 allowanceKey,
        Consumption[] memory consumptions
    ) private view returns (Consumption[] memory, uint256 index) {
        bool found;
        (index, found) = Consumptions.find(consumptions, allowanceKey);

        // Always clone before modifying
        consumptions = Consumptions.clone(consumptions);

        if (!found) {
            (uint128 balance, uint64 timestamp) = AllowanceLoader.accrue(
                allowanceKey,
                uint64(block.timestamp)
            );

            // Append new consumption entry
            Consumption[] memory extended = new Consumption[](
                consumptions.length + 1
            );
            for (uint256 i; i < consumptions.length; ++i) {
                extended[i] = consumptions[i];
            }
            extended[consumptions.length] = Consumption({
                allowanceKey: allowanceKey,
                balance: balance,
                consumed: 0,
                timestamp: timestamp
            });
            consumptions = extended;
            index = consumptions.length - 1;
        }

        return (consumptions, index);
    }
}
