// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./_Core.sol";

/**
 * @title AllowanceTracker - a component of the Zodiac Roles Mod that is
 * responsible for loading and calculating allowance balances. Persists
 * consumptions back to storage.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */
abstract contract AllowanceTracker is Core {
    event ConsumeAllowance(
        bytes32 allowanceKey,
        uint128 consumed,
        uint128 newBalance
    );

    function _accruedAllowance(
        Allowance memory allowance,
        uint64 blockTimestamp
    ) internal pure override returns (uint128 balance, uint64 timestamp) {
        if (
            allowance.period == 0 ||
            blockTimestamp < (allowance.timestamp + allowance.period)
        ) {
            return (allowance.balance, allowance.timestamp);
        }

        uint64 elapsedIntervals = (blockTimestamp - allowance.timestamp) /
            allowance.period;

        if (allowance.balance < allowance.maxRefill) {
            balance = allowance.balance + allowance.refill * elapsedIntervals;

            balance = balance < allowance.maxRefill
                ? balance
                : allowance.maxRefill;
        } else {
            balance = allowance.balance;
        }

        timestamp = allowance.timestamp + elapsedIntervals * allowance.period;
    }

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

            bytes32 key = consumption.allowanceKey;
            uint128 consumed = consumption.consumed;

            // Retrieve the allowance and calculate its current updated balance
            // and next refill timestamp.
            Allowance storage allowance = allowances[key];
            (uint128 balance, uint64 timestamp) = _accruedAllowance(
                allowance,
                uint64(block.timestamp)
            );

            assert(balance == consumption.balance);
            assert(consumed <= balance);
            // Flush
            allowance.balance = balance - consumed;
            allowance.timestamp = timestamp;

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
            bytes32 key = consumption.allowanceKey;
            if (success) {
                emit ConsumeAllowance(
                    key,
                    consumption.consumed,
                    consumption.balance - consumption.consumed
                );
            } else {
                allowances[key].balance = consumption.balance;
            }
            unchecked {
                ++i;
            }
        }
    }
}
