// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/IPriceAdapter.sol";

import "../../types/Types.sol";

/**
 * @title WithinRatioChecker
 * @notice
 * Validates that a "relative" amount falls within a ratio range when compared
 * to a "reference" amount, optionally converting none/one/both through price
 * adapters into a common base denomination.
 *
 * ---
 * # 1. How it Works
 * Extract two amounts from plucked values (by index), normalize their
 * decimals, optionally convert via adapters, compute their ratio in basis
 * points, and check if it falls within [minRatio, maxRatio].
 *
 * Steps:
 *  1. Read amounts from plucked values by index
 *  2. Scale amounts to shared precision
 *  3. Apply optional price adapters
 *  4. Compute ratio = (relative × priceRel) / (reference × priceRef)
 *  5. Validate ratio in bps (10,000 = 100%)
 *
 * ---
 * # 2. Inputs
 * - **compValue**: 52-byte configuration (see below)
 * - **pluckedValues**: Array of values extracted by Pluck operators earlier
 *   in the evaluation. Reference and relative indices point into this array.
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
 *   0      : referenceIndex      (uint8) - index into pluckedValues
 *   1      : referenceDecimals   (uint8)
 *   2      : relativeIndex       (uint8) - index into pluckedValues
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

/**
 * @title WithinRatioChecker
 *
 * @notice Validates that the ratio between two plucked amounts falls within configured bounds, with optional price conversion for cross-asset comparisons.
 *
 */

library WithinRatioChecker {
    /// @dev 100% = 10000 bps
    uint256 private constant BPS = 10000;

    struct CompValue {
        uint8 referenceIndex;
        uint8 referenceDecimals;
        uint8 relativeIndex;
        uint8 relativeDecimals;
        uint32 minRatio;
        uint32 maxRatio;
        address referenceAdapter;
        address relativeAdapter;
    }

    function check(
        bytes memory compValue,
        bytes32[] memory pluckedValues
    ) internal view returns (Status) {
        CompValue memory config = _unpack(compValue);

        (uint256 referenceAmount, uint256 relativeAmount) = _scaleAndConvert(
            config,
            pluckedValues
        );

        uint256 ratio = (relativeAmount * BPS) / referenceAmount;

        if (config.minRatio > 0 && ratio < config.minRatio) {
            return Status.RatioBelowMin;
        }
        if (config.maxRatio > 0 && ratio > config.maxRatio) {
            return Status.RatioAboveMax;
        }

        return Status.Ok;
    }

    function _unpack(
        bytes memory compValue
    ) private pure returns (CompValue memory config) {
        bytes32 compValue32 = bytes32(compValue);

        config.referenceIndex = uint8(bytes1(compValue32));
        config.referenceDecimals = uint8(bytes1(compValue32 << 8));
        config.relativeIndex = uint8(bytes1(compValue32 << 16));
        config.relativeDecimals = uint8(bytes1(compValue32 << 24));
        config.minRatio = uint32(bytes4(compValue32 << 32));
        config.maxRatio = uint32(bytes4(compValue32 << 64));
        config.referenceAdapter = address(bytes20(compValue32 << 96));
        if (compValue.length > 32) {
            assembly {
                mstore(add(config, 0xe0), shr(96, mload(add(compValue, 0x40))))
            }
        }
    }

    function _scaleAndConvert(
        CompValue memory config,
        bytes32[] memory pluckedValues
    )
        private
        view
        returns (
            uint256 convertedReferenceAmount,
            uint256 convertedRelativeAmount
        )
    {
        // Calculate precision
        uint256 precision = config.referenceDecimals > config.relativeDecimals
            ? config.referenceDecimals
            : config.relativeDecimals;
        precision = precision > 18 ? precision : 18;

        // Extract and scale amounts from plucked values
        uint256 referenceAmount = uint256(
            pluckedValues[config.referenceIndex]
        ) * (10 ** (precision - config.referenceDecimals));

        uint256 relativeAmount = uint256(pluckedValues[config.relativeIndex]) *
            (10 ** (precision - config.relativeDecimals));

        // Get prices from adapters
        uint256 priceScale = 10 ** (precision - 18);
        uint256 priceReference = config.referenceAdapter != address(0)
            ? IPriceAdapter(config.referenceAdapter).getPrice() * priceScale
            : (10 ** precision);

        uint256 priceRelative = config.relativeAdapter != address(0)
            ? IPriceAdapter(config.relativeAdapter).getPrice() * priceScale
            : (10 ** precision);

        // Convert to common base
        uint256 denominator = 10 ** precision;
        convertedReferenceAmount =
            (referenceAmount * priceReference) /
            denominator;
        convertedRelativeAmount =
            (relativeAmount * priceRelative) /
            denominator;
    }
}
