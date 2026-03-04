// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "../interfaces/IPricing.sol";
import "./interfaces/IChainlinkAggregatorV3.sol";

/**
 * @title ChainlinkPricing
 * @notice Generic pricing adapter over Chainlink AggregatorV3 feeds.
 * @dev Returns 18-decimal fixed-point prices. Params are encoded as
 *      `(address feed, bool invert)`.
 */
contract ChainlinkPricing is IPricing {
    uint256 private constant ONE = 1e18;

    uint32 public immutable maxAge;
    bool public immutable enforceRoundCompleteness;

    error InvalidSource();
    error InvalidAnswer();
    error InvalidRound();
    error StalePrice(uint256 updatedAt, uint256 maxAge);
    error ZeroPrice();

    constructor(uint32 _maxAge, bool _enforceRoundCompleteness) {
        maxAge = _maxAge;
        enforceRoundCompleteness = _enforceRoundCompleteness;
    }

    /// @inheritdoc IPricing
    function getPrice(bytes calldata params) external view returns (uint256 price) {
        (address source, bool invert) = abi.decode(params, (address, bool));
        if (source == address(0)) revert InvalidSource();

        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = IChainlinkAggregatorV3(source).latestRoundData();

        if (answer <= 0) revert InvalidAnswer();
        if (enforceRoundCompleteness && answeredInRound < roundId) {
            revert InvalidRound();
        }

        if (maxAge != 0) {
            if (updatedAt == 0 || block.timestamp - updatedAt > maxAge) {
                revert StalePrice(updatedAt, maxAge);
            }
        }

        uint8 decimals = IChainlinkAggregatorV3(source).decimals();
        uint256 scaled = uint256(answer);
        if (decimals < 18) {
            scaled *= 10 ** (18 - decimals);
        } else if (decimals > 18) {
            scaled /= 10 ** (decimals - 18);
        }

        if (scaled == 0) revert ZeroPrice();

        if (invert) {
            price = (ONE * ONE) / scaled;
            if (price == 0) revert ZeroPrice();
        } else {
            price = scaled;
        }
    }
}
