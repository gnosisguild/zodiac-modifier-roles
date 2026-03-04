// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "../interfaces/IPricing.sol";

/**
 * @title ConsensusPricing
 * @notice Aggregates prices from multiple IPricing adapters and returns the arithmetic mean.
 * @dev Params are encoded as:
 *      `(PriceSource[] sources, uint256 maxDeviationBps)` where
 *      `PriceSource = (address adapter, bytes params)`.
 *      Each source is queried as `IPricing(adapter).getPrice(params)`.
 */
contract ConsensusPricing is IPricing {
    uint256 private constant BPS = 10_000;

    struct PriceSource {
        address adapter;
        bytes params;
    }

    error InvalidAdapterCount();
    error InvalidAdapter(uint256 index);
    error InvalidMaxDeviationBps(uint256 maxDeviationBps);
    error DeviationExceeded(
        uint256 index,
        uint256 price,
        uint256 mean,
        uint256 maxDeviationBps
    );

    /// @inheritdoc IPricing
    function getPrice(bytes calldata params) external view returns (uint256 mean) {
        (PriceSource[] memory sources, uint256 maxDeviationBps) = abi.decode(
            params,
            (PriceSource[], uint256)
        );

        uint256 length = sources.length;
        if (length < 2) revert InvalidAdapterCount();
        if (maxDeviationBps > BPS) revert InvalidMaxDeviationBps(maxDeviationBps);

        uint256[] memory prices = new uint256[](length);

        for (uint256 i; i < length; ++i) {
            address adapter = sources[i].adapter;
            if (adapter == address(0)) revert InvalidAdapter(i);

            uint256 price = IPricing(adapter).getPrice(sources[i].params);
            prices[i] = price;
            mean += price;
        }

        mean /= length;

        if (maxDeviationBps == 0) {
            for (uint256 i; i < length; ++i) {
                if (prices[i] != mean) {
                    revert DeviationExceeded(i, prices[i], mean, maxDeviationBps);
                }
            }
            return mean;
        }

        for (uint256 i; i < length; ++i) {
            uint256 price = prices[i];
            uint256 diff = price > mean ? price - mean : mean - price;

            if (diff * BPS > mean * maxDeviationBps) {
                revert DeviationExceeded(i, price, mean, maxDeviationBps);
            }
        }
    }
}
