// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./_Core.sol";
import "./AllowanceLoader.sol";

/**
 * @title AllowanceTracker - a component of the Zodiac Roles Mod that is
 * responsible for loading and calculating allowance balances. Persists
 * consumptions back to storage.
 */
abstract contract AllowanceTracker is Core {
    event ConsumeAllowance(
        bytes32 allowanceKey,
        uint128 consumed,
        uint128 newBalance
    );

    /**
     * @dev Flushes the consumption of allowances back into storage, before
     * execution. This flush is not final
     * @param consumptions The array of consumption structs containing
     * information about allowances and consumed amounts.
     */
    function _flushPrepare(Consumption[] memory consumptions) internal {
        uint256 count = consumptions.length;

        for (uint256 i; i < count; ) {
            Consumption memory consumption = consumptions[i];

            assert(consumption.consumed <= consumption.balance);

            AllowanceLoader.store(
                consumption.allowanceKey,
                consumption.timestamp,
                consumption.balance - consumption.consumed
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Finalizes or reverts the flush of allowances, after transaction
     * execution
     * @param consumptions The array of consumption structs containing
     * information about allowances and consumed amounts.
     * @param success a boolean that indicates whether transaction execution
     * was successful
     */
    function _flushCommit(
        Consumption[] memory consumptions,
        bool success
    ) internal {
        uint256 count = consumptions.length;
        for (uint256 i; i < count; ) {
            Consumption memory consumption = consumptions[i];
            if (success) {
                emit ConsumeAllowance(
                    consumption.allowanceKey,
                    consumption.consumed,
                    consumption.balance - consumption.consumed
                );
            } else {
                AllowanceLoader.store(
                    consumption.allowanceKey,
                    consumption.balance
                );
            }
            unchecked {
                ++i;
            }
        }
    }
}
