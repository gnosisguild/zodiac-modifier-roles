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
 *                 relativeAmount × relativePrice
 *   ratio (bps) = ──────────────────────────────── × 10,000
 *                 referenceAmount × referencePrice
 *
 * Where:
 * - `relativeAmount`: Value extracted from calldata[relativeIndex], scaled to common precision
 * - `referenceAmount`: Value extracted from calldata[referenceIndex], scaled to common precision
 * - `relativePrice`: Price from relativeAdapter (18 decimals), or 1e18 if no adapter
 * - `referencePrice`: Price from referenceAdapter (18 decimals), or 1e18 if no adapter
 *
 * Both amounts are converted to a common base (e.g., USD) via their respective adapters,
 * then compared. This avoids needing pair-specific adapters.
 *
 *
 * ## CompValue Encoding (52 bytes)
 *
 *   byte 0      (1 byte):  referenceIndex      - index in parent.children
 *   byte 1      (1 byte):  referenceDecimals   - decimals of reference token
 *   byte 2      (1 byte):  relativeIndex       - index in parent.children
 *   byte 3      (1 byte):  relativeDecimals    - decimals of relative token
 *   bytes 4–7   (4 bytes): minRatio (bps)      - 0 = no lower bound
 *   bytes 8–11  (4 bytes): maxRatio (bps)      - 0 = no upper bound
 *   bytes 12–31 (20 bytes): referenceAdapter   - converts reference token to common base (e.g., ETH/USD)
 *                                                0x0 = no conversion (use 1.0)
 *   bytes 32–51 (20 bytes): relativeAdapter    - converts relative token to common base (e.g., BTC/USD)
 *                                                0x0 = no conversion (use 1.0)
 *
 * Example: To validate BTC amount vs ETH amount, use ETH/USD and BTC/USD adapters
 * instead of needing a custom ETH/BTC adapter.
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
        (
            ScaleFactors memory factors,
            uint256 priceRef,
            uint256 priceRel
        ) = _conversions(compValue);

        uint32 minRatio = uint32(bytes4(compValue32 << 32));
        uint32 maxRatio = uint32(bytes4(compValue32 << 64));

        uint256 referenceAmount = uint256(
            AbiDecoder.word(
                data,
                parentPayload.children[uint8(bytes1(compValue32))].location
            )
        ) * factors.reference_;

        uint256 relativeAmount = uint256(
            AbiDecoder.word(
                data,
                parentPayload
                    .children[uint8(bytes1(compValue32 << 16))]
                    .location
            )
        ) * factors.relative;

        // Calculate ratio by converting both amounts to common base
        uint256 denominator = 10 ** factors.precision;
        uint256 referenceInBase = (referenceAmount * priceRef) / denominator;
        uint256 relativeInBase = (relativeAmount * priceRel) / denominator;
        uint256 ratio = (relativeInBase * BPS) / referenceInBase;

        if (minRatio > 0 && ratio < minRatio) {
            return Status.RatioBelowMin;
        }
        if (maxRatio > 0 && ratio > maxRatio) {
            return Status.RatioAboveMax;
        }

        return Status.Ok;
    }

    function _conversions(
        bytes memory compValue
    )
        private
        view
        returns (
            ScaleFactors memory factors,
            uint256 priceRef,
            uint256 priceRel
        )
    {
        bytes32 compValue32 = bytes32(compValue);

        uint8 referenceDecimals = uint8(bytes1(compValue32 << 8));
        uint8 relativeDecimals = uint8(bytes1(compValue32 << 24));
        uint8 priceDecimals = 18;
        uint256 precision = referenceDecimals > relativeDecimals
            ? referenceDecimals
            : relativeDecimals;
        precision = precision > priceDecimals ? precision : priceDecimals;

        factors = ScaleFactors({
            reference_: 10 ** (precision - referenceDecimals),
            relative: 10 ** (precision - relativeDecimals),
            price: 10 ** (precision - priceDecimals),
            precision: precision
        });

        // Extract and get price for reference adapter
        address referenceAdapter = address(bytes20(compValue32 << 96));
        priceRef = referenceAdapter != address(0)
            ? IPriceAdapter(referenceAdapter).getPrice() * factors.price
            : (10 ** precision);

        // Extract and get price for relative adapter
        address relativeAdapter;
        if (compValue.length > 32) {
            assembly {
                relativeAdapter := shr(96, mload(add(compValue, 0x40)))
            }
        }
        priceRel = relativeAdapter != address(0)
            ? IPriceAdapter(relativeAdapter).getPrice() * factors.price
            : (10 ** precision);

        return (factors, priceRef, priceRel);
    }

    struct ScaleFactors {
        uint256 reference_;
        uint256 relative;
        uint256 price;
        uint256 precision;
    }
}
