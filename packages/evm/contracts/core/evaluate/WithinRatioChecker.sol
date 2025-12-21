// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../periphery/interfaces/IPricing.sol";

import "../../types/Types.sol";

/**
 * @title WithinRatioChecker
 * @notice Validates that a relative amount falls within a ratio range of a
 *         reference amount, with optional price adapter conversion.
 *
 * @dev Ratio is computed in basis points (10000 = 100%). Both amounts are read
 *      from pluckedValues by index, scaled to shared precision, optionally
 *      converted via price adapters, then compared against [minRatio, maxRatio].
 *
 * @author gnosisguild
 */
library WithinRatioChecker {
    /// @dev 100% = 10000 bps
    uint256 private constant BPS = 10000;

    function check(
        bytes memory compValue,
        bytes32[] memory pluckedValues
    ) internal view returns (Status) {
        CompValue memory unpacked = _unpack(compValue);

        (uint256 referenceAmount, uint256 relativeAmount) = _scaleAndConvert(
            unpacked,
            pluckedValues
        );

        /*
         *                 relativeAmount × priceRel
         *   ratio (bps) = ───────────────────────── × 10,000
         *                 referenceAmount × priceRef
         */
        uint256 ratio = (relativeAmount * BPS) / referenceAmount;

        if (unpacked.minRatio > 0 && ratio < unpacked.minRatio) {
            return Status.RatioBelowMin;
        }
        if (unpacked.maxRatio > 0 && ratio > unpacked.maxRatio) {
            return Status.RatioAboveMax;
        }

        return Status.Ok;
    }

    function _scaleAndConvert(
        CompValue memory unpacked,
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
        uint256 precision = unpacked.referenceDecimals >
            unpacked.relativeDecimals
            ? unpacked.referenceDecimals
            : unpacked.relativeDecimals;
        precision = precision > 18 ? precision : 18;

        // Extract and scale amounts from plucked values
        uint256 referenceAmount = uint256(
            pluckedValues[unpacked.referenceIndex]
        ) * (10 ** (precision - unpacked.referenceDecimals));

        uint256 relativeAmount = uint256(
            pluckedValues[unpacked.relativeIndex]
        ) * (10 ** (precision - unpacked.relativeDecimals));

        /*
         * Get prices from adapters (address(0) = disabled = 1:1)
         *
         * Examples:
         *   - Cross-asset (BTC vs ETH via USD):
         *       refAdapter = ETH/USD, relAdapter = BTC/USD
         *   - Single adapter (WBTC vs ETH, base = ETH):
         *       refAdapter = 0, relAdapter = WBTC/ETH
         */
        uint256 priceScale = 10 ** (precision - 18);
        uint256 priceReference = unpacked.referenceAdapter != address(0)
            ? IPricing(unpacked.referenceAdapter).getPrice() * priceScale
            : (10 ** precision);

        uint256 priceRelative = unpacked.relativeAdapter != address(0)
            ? IPricing(unpacked.relativeAdapter).getPrice() * priceScale
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

    function _unpack(
        bytes memory compValue
    ) private pure returns (CompValue memory unpacked) {
        /**
         * CompValue Layout (12 or 52 bytes):
         * ┌─────────┬─────────┬─────────┬─────────┬──────────┬──────────┬─────────────────┬─────────────────┐
         * │  refIdx │ refDec  │ relIdx  │ relDec  │ minRatio │ maxRatio │   refAdapter    │   relAdapter    │
         * │ (uint8) │ (uint8) │ (uint8) │ (uint8) │ (uint32) │ (uint32) │    (address)    │    (address)    │
         * ├─────────┼─────────┼─────────┼─────────┼──────────┼──────────┼─────────────────┼─────────────────┤
         * │    0    │    1    │    2    │    3    │   4–7    │   8–11   │     12–31       │     32–51       │
         * └─────────┴─────────┴─────────┴─────────┴──────────┴──────────┴─────────────────┴─────────────────┘
         *                                                               └────────────── optional ──────────┘
         */
        bytes32 packedBytes32 = bytes32(compValue);

        unpacked.referenceIndex = uint8(bytes1(packedBytes32));
        unpacked.referenceDecimals = uint8(bytes1(packedBytes32 << 8));
        unpacked.relativeIndex = uint8(bytes1(packedBytes32 << 16));
        unpacked.relativeDecimals = uint8(bytes1(packedBytes32 << 24));
        unpacked.minRatio = uint32(bytes4(packedBytes32 << 32));
        unpacked.maxRatio = uint32(bytes4(packedBytes32 << 64));
        unpacked.referenceAdapter = address(bytes20(packedBytes32 << 96));
        if (compValue.length > 32) {
            assembly {
                mstore(
                    add(unpacked, 0xe0),
                    shr(96, mload(add(compValue, 0x40)))
                )
            }
        }
    }

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
}
