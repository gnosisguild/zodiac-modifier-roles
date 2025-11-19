// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../AbiDecoder.sol";
import "../AbiTypes.sol";
import "../Types.sol";

import "../adapters/IPriceAdapter.sol";

/**
 * @title WithinRatioChecker
 * @notice
 * Validates that a “relative” amount falls within a ratio range when compared
 * to a “reference” amount, optionally converting none/one/both through price
 * adapters into a common base denomination.
 *
 * ---
 * # 1. How it Works
 * Extract two amounts from calldata (by index in the parent), normalize their
 * decimals, optionally convert via adapters, compute their ratio in basis
 * points, and check if it falls within [minRatio, maxRatio].
 *
 * Steps:
 *  1. Read amounts from calldata by index
 *  2. Scale amounts to shared precision
 *  3. Apply optional price adapters
 *  4. Compute ratio = (relative × priceRel) / (reference × priceRef)
 *  5. Validate ratio in bps (10,000 = 100%)
 *
 * ---
 * # 2. Inputs
 * - **data**: Calldata being inspected
 * - **compValue**: 52-byte configuration (see bellow)
 * - **parentPayload**: Structural parent payload. WithinRatio is a
 *   non-structural operator, so it receives the nearest structural parent’s
 *   payload and indexes into its children.
 *
 * ---
 * # 3. Ratio Formula
 *
 *                 relativeAmount × priceRel
 *   ratio (bps) = ───────────────────────── × 10,000
 *                 referenceAmount × priceRef
 *
 * Scaling rules:
 * - Amounts scale to max(referenceDecimals, relativeDecimals, 18)
 * - Price adapters return 18-dec prices; are also scaled to precision
 * - Disabled adapter → price = 10^precision
 * - Bounds are inclusive
 *
 * ---
 * # 4. CompValue Layout (52 bytes)
 *
 *   0      : referenceIndex      (uint8)
 *   1      : referenceDecimals   (uint8)
 *   2      : relativeIndex       (uint8)
 *   3      : relativeDecimals    (uint8)
 *   4–7    : minRatio  (uint32, bps; 0 = no min)
 *   8–11   : maxRatio  (uint32, bps; 0 = no max)
 *   12–31  : referenceAdapter (address; 0 = disabled)
 *   32–51  : relativeAdapter  (address; 0 = disabled)
 *
 * ---
 * # 5. Adapter Examples
 *
 * - Two adapters (BTC vs ETH via USD):
 *     referenceAdapter = ETH/USD
 *     relativeAdapter  = BTC/USD
 *
 * - One adapter (WBTC vs ETH, base = ETH):
 *     referenceAdapter = 0
 *     relativeAdapter  = WBTC/ETH
 *
 * ---
 * # 6. Use Cases
 *
 * - Output slippage:  minRatio = 9950 (≥ 99.5%)
 * - Input slippage:   maxRatio = 10050 (≤ 100.5%)
 */
library WithinRatioChecker {
    /// @dev 100% = 10000 bps
    uint256 private constant BPS = 10000;

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
