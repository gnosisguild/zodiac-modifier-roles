// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../common/PriceConversion.sol";
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
    /**
     * @dev Configuration decoded from compValue bytes.
     *
     *
     * Layout (12 or 52 bytes):
     * ┌───────────────────┬───────────────────┬───────────────────┬───────────────────┬────────────┬────────────┬───────────────────┬───────────────────┐
     * │ referencePluckIdx │ referenceDecimals │ relativePluckIdx  │ relativeDecimals  │  minRatio  │  maxRatio  │ referenceAdapter  │ relativeAdapter   │
     * │      (uint8)      │      (uint8)      │      (uint8)      │      (uint8)      │  (uint32)  │  (uint32)  │     (address)     │     (address)     │
     * ├───────────────────┼───────────────────┼───────────────────┼───────────────────┼────────────┼────────────┼───────────────────┼───────────────────┤
     * │         0         │         1         │         2         │         3         │    4–7     │    8–11    │      12–31        │      32–51        │
     * └───────────────────┴───────────────────┴───────────────────┴───────────────────┴────────────┴────────────┴───────────────────┴───────────────────┘
     *                                                                                                          └─────────────────── optional ──────────┘
     */
    struct CompValue {
        uint8 referencePluckIndex;
        uint8 referenceDecimals;
        uint8 relativePluckIndex;
        uint8 relativeDecimals;
        uint32 minRatio;
        uint32 maxRatio;
        address referenceAdapter;
        address relativeAdapter;
    }

    uint256 private constant BPS = 10000;

    /**
     * @notice Checks if ratio of relative to reference amount is within bounds.
     * @param compValue Packed configuration bytes
     * @param pluckedValues Array of values extracted from calldata
     * @return Status Ok if within bounds, error status otherwise
     */
    function check(
        bytes memory compValue,
        bytes32[] memory pluckedValues
    ) internal view returns (Status) {
        CompValue memory config = _unpack(compValue);
        (
            Status status,
            uint256 referenceAmount,
            uint256 relativeAmount
        ) = _convert(config, pluckedValues);
        if (status != Status.Ok) {
            return status;
        }

        /*
         *                 relativeAmount × priceRel
         *   ratio (bps) = ───────────────────────── × 10,000
         *                 referenceAmount × priceRef
         */
        uint256 ratio = (relativeAmount * BPS) / referenceAmount;

        if (config.minRatio != 0 && ratio < config.minRatio) {
            return Status.RatioBelowMin;
        }
        if (config.maxRatio != 0 && ratio > config.maxRatio) {
            return Status.RatioAboveMax;
        }

        return Status.Ok;
    }

    /**
     * @dev Extracts and converts reference and relative amounts for ratio comparison.
     *
     *      1. Reads raw values from pluckedValues by index
     *      2. Scales both to the higher decimal precision
     *      3. Applies price adapters (if configured)
     */
    function _convert(
        CompValue memory config,
        bytes32[] memory pluckedValues
    )
        private
        view
        returns (Status status, uint256 referenceAmount, uint256 relativeAmount)
    {
        uint256 precision = config.referenceDecimals > config.relativeDecimals
            ? config.referenceDecimals
            : config.relativeDecimals;

        (status, referenceAmount) = _scaleAndPrice(
            uint256(pluckedValues[config.referencePluckIndex]),
            config.referenceDecimals,
            precision,
            config.referenceAdapter
        );
        if (status != Status.Ok) return (status, 0, 0);

        (status, relativeAmount) = _scaleAndPrice(
            uint256(pluckedValues[config.relativePluckIndex]),
            config.relativeDecimals,
            precision,
            config.relativeAdapter
        );
        if (status != Status.Ok) return (status, 0, 0);
    }

    function _scaleAndPrice(
        uint256 value,
        uint256 decimals,
        uint256 precision,
        address adapter
    ) private view returns (Status, uint256) {
        return
            PriceConversion.convert(
                value * (10 ** (precision - decimals)),
                adapter
            );
    }

    function _unpack(
        bytes memory compValue
    ) private pure returns (CompValue memory config) {
        bytes32 packed = bytes32(compValue);

        config.referencePluckIndex = uint8(bytes1(packed));
        config.referenceDecimals = uint8(bytes1(packed << 8));
        config.relativePluckIndex = uint8(bytes1(packed << 16));
        config.relativeDecimals = uint8(bytes1(packed << 24));
        config.minRatio = uint32(bytes4(packed << 32));
        config.maxRatio = uint32(bytes4(packed << 64));
        config.referenceAdapter = address(bytes20(packed << 96));

        if (compValue.length > 32) {
            assembly {
                mstore(add(config, 0xe0), shr(96, mload(add(compValue, 0x40))))
            }
        }
    }
}
