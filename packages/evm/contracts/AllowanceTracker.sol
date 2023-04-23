// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Core.sol";

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
        uint256 timestamp
    ) internal pure override returns (uint128 balance, uint64 refillTimestamp) {
        if (
            allowance.refillInterval == 0 ||
            timestamp < allowance.refillTimestamp + allowance.refillInterval
        ) {
            return (allowance.balance, allowance.refillTimestamp);
        }

        uint64 elapsedIntervals = (uint64(timestamp) -
            allowance.refillTimestamp) / allowance.refillInterval;

        uint128 uncappedBalance = allowance.balance +
            allowance.refillAmount *
            elapsedIntervals;

        balance = uncappedBalance < allowance.maxBalance
            ? uncappedBalance
            : allowance.maxBalance;

        refillTimestamp =
            allowance.refillTimestamp +
            elapsedIntervals *
            allowance.refillInterval;
    }

    /**
     * @dev Flushes the consumption of allowances back into storage, before
     * execution. This flush is not final
     * @param consumptions The array of consumption structs containing
     * information about allowances and consumed amounts.
     */
    function _flushPrepare(Consumption[] memory consumptions) internal {
        uint256 count = consumptions.length;
        unchecked {
            for (uint256 i; i < count; ++i) {
                Consumption memory consumption = consumptions[i];

                bytes32 key = consumption.allowanceKey;
                uint128 consumed = consumption.consumed;

                // Retrieve the allowance and calculate its current updated balance
                // and next refill timestamp.
                Allowance storage allowance = allowances[key];
                (uint128 balance, uint64 refillTimestamp) = _accruedAllowance(
                    allowance,
                    block.timestamp
                );

                assert(balance == consumption.balance);
                assert(consumed <= balance);
                // Flush
                allowance.balance = balance - consumed;
                allowance.refillTimestamp = refillTimestamp;

                // Emit an event to signal the total consumed amount.
                emit ConsumeAllowance(key, consumed, balance - consumed);
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
        unchecked {
            for (uint256 i; i < count; ++i) {
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
            }
        }
    }
}
