// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../AbiDecoder.sol";
import "../AbiTypes.sol";
import "../Types.sol";

import "../adapters/IPriceAdapter.sol";

/**
 * @title WithinRatioChecker - A library for validating that two calldata
 * amounts fall within an acceptable ratio
 * @author gnosisguild
 *
 *
 * Validates that a *relative* amount is within acceptable bounds compared to
 * a *reference* amount, with optional price conversion between different asset
 * denominations. The check extracts both amounts from calldata using their
 * specified child indices, normalizes them to a common decimal precision,
 * applies the price conversion if provided, then verifies the resulting ratio
 * falls within [minRatio, maxRatio] bounds (expressed in basis points).
 *
 *
 * ### The Ratio Formula
 *
 *                 relativeAmount
 *   ratio (bps) = ────────────────────────── × 10,000
 *                 referenceAmount × price
 *
 * Where:
 * - `relativeAmount`: Value extracted from calldata[relativeIndex], scaled to common precision
 * - `referenceAmount`: Value extracted from calldata[referenceIndex], scaled to common precision
 * - `price`: Oracle price from adapter (18 decimals), or 1e18 if no adapter
 *
 *
 * ## CompValue Encoding (32 bytes)
 *
 *   byte 0      (1 byte):  referenceIndex      - index in parent.children
 *   byte 1      (1 byte):  referenceDecimals   - decimals of reference token
 *   byte 2      (1 byte):  relativeIndex       - index in parent.children
 *   byte 3      (1 byte):  relativeDecimals    - decimals of relative token
 *   bytes 4–7   (4 bytes): minRatio (bps)      - 0 = no lower bound
 *   bytes 8–11  (4 bytes): maxRatio (bps)      - 0 = no upper bound
 *   bytes 12–31 (20 bytes): adapter address    - oracle returning the price of the "relative asset" in terms of "reference asset" with
 *                                                18 decimals precision. 0x0 = no oracle (price = 1e18).
 *
 *
 * ## Use Case: Slippage Guard
 *
 * Primary application is AMM slippage protection:
 * - Enforce `minAmountOut` ≥ X% of expected output given `amountIn`
 * - Enforce `maxAmountIn` ≤ Y% of expected input given `amountOut`
 *
 * Example: Set minRatio = 9950 bps to allow maximum 50 basis points (0.5%)
 * of slippage, ensuring user receives at least 99.5% of expected amount.
 */

library WithinRatioChecker {
    /// @dev Basis points denominator (100% = 10000 bps)
    uint256 private constant BPS = 10000;

    /**
     * @notice Checks if relative amount is within acceptable bounds of the reference amount
     */
    function check(
        bytes calldata data,
        bytes memory compValue,
        Payload memory parentPayload
    ) internal view returns (Status) {
        bytes32 compValue32 = bytes32(compValue);
        ScaleFactors memory factors = _factors(compValue32);

        uint8 referenceIndex = uint8(bytes1(compValue32));
        uint8 relativeIndex = uint8(bytes1(compValue32 << 16));
        uint32 minRatio = uint32(bytes4(compValue32 << 32));
        uint32 maxRatio = uint32(bytes4(compValue32 << 64));
        address adapter = address(bytes20(compValue32 << 96));

        uint256 referenceAmount = uint256(
            AbiDecoder.word(
                data,
                parentPayload.children[referenceIndex].location
            )
        ) * factors.reference_;

        uint256 relativeAmount = uint256(
            AbiDecoder.word(
                data,
                parentPayload.children[relativeIndex].location
            )
        ) * factors.relative;

        uint256 price = adapter != address(0)
            ? IPriceAdapter(adapter).getPrice() * factors.price
            : factors.denominator;

        {
            uint256 expected = (referenceAmount * price) / factors.denominator;
            uint256 ratio = (relativeAmount * BPS) / expected;
            if (minRatio > 0 && ratio < minRatio) {
                return Status.RatioBelowMin;
            }
            if (maxRatio > 0 && ratio > maxRatio) {
                return Status.RatioAboveMax;
            }
        }

        return Status.Ok;
    }

    function _factors(
        bytes32 compValue
    ) private pure returns (ScaleFactors memory) {
        uint8 referenceDecimals = uint8(bytes1(compValue << 8));
        uint8 relativeDecimals = uint8(bytes1(compValue << 24));
        uint8 priceDecimals = 18;
        uint256 max = referenceDecimals > relativeDecimals
            ? referenceDecimals
            : relativeDecimals;
        max = max > priceDecimals ? max : priceDecimals;

        return
            ScaleFactors({
                reference_: 10 ** (max - referenceDecimals),
                relative: 10 ** (max - relativeDecimals),
                price: 10 ** (max - priceDecimals),
                denominator: 10 ** max
            });
    }

    struct ScaleFactors {
        uint256 reference_;
        uint256 relative;
        uint256 price;
        uint256 denominator;
    }
}
