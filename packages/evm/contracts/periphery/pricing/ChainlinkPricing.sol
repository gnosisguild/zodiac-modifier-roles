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
 *      `(address feed, bool invert, uint256 maxAge)`.
 */
contract ChainlinkPricing is IPricing {
    uint256 private constant ONE = 1e18;

    error InvalidSource();
    error InvalidAnswer();
    error StalePrice(uint256 updatedAt, uint256 maxAge);
    error ZeroPrice();

    function getPrice(
        bytes calldata params
    ) external view returns (uint256 price) {
        (address source, bool invert, uint256 _maxAge) = abi.decode(
            params,
            (address, bool, uint256)
        );
        if (source == address(0)) revert InvalidSource();

        (, int256 answer, , uint256 updatedAt, ) = IChainlinkAggregatorV3(
            source
        ).latestRoundData();

        if (answer <= 0) revert InvalidAnswer();

        if (updatedAt == 0 || block.timestamp - updatedAt > _maxAge) {
            revert StalePrice(updatedAt, _maxAge);
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
