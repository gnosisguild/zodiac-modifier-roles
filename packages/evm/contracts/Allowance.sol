// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

struct Allowance {
    // refillInterval - duration of the period in seconds, 0 for one-time allowance
    // refillAmount - amount that will be replenished "at the start of every period" (replace with: per period)
    // refillTimestamp - timestamp of the last interval refilled for;
    // maxBalance - max accrual amount, replenishing stops once the unused allowance hits this value
    // balance - unused allowance;

    // order matters
    uint128 refillAmount;
    uint128 maxBalance;
    uint64 refillInterval;
    // only these these two fields are updated on accrual, should live in the same word
    uint64 refillTimestamp;
    uint128 balance;
}

function accruedBalance(
    Allowance memory allowance,
    uint256 timestamp
) pure returns (uint128 balance, uint64 refillTimestamp) {
    if (
        allowance.refillInterval == 0 || timestamp < allowance.refillTimestamp
    ) {
        return (allowance.balance, allowance.refillTimestamp);
    }

    uint64 elapsedIntervals = (uint64(timestamp) - allowance.refillTimestamp) /
        allowance.refillInterval;

    uint128 uncappedBalance = allowance.balance +
        allowance.refillAmount *
        elapsedIntervals;

    balance = uncappedBalance < allowance.maxBalance
        ? uncappedBalance
        : allowance.maxBalance;

    refillTimestamp =
        allowance.refillTimestamp +
        elapsedIntervals *
        allowance.refillTimestamp;
}
