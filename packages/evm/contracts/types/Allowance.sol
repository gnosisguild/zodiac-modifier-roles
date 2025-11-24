// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

/// @notice The order of members in the `Allowance` struct is significant; members updated during accrual (`balance` and `timestamp`) should be stored in the same word.
/// @custom:member refill Amount added to balance after each period elapses.
/// @custom:member maxRefill Refilling stops when balance reaches this value.
/// @custom:member period Duration, in seconds, before a refill occurs. If set to 0, the allowance is for one-time use and won't be replenished.
/// @custom:member balance Remaining allowance available for use. Decreases with usage and increases after each refill by the specified refill amount.
/// @custom:member timestamp Timestamp when the last refill occurred.
struct Allowance {
    uint128 refill;
    uint128 maxRefill;
    uint64 period;
    uint128 balance;
    uint64 timestamp;
}
