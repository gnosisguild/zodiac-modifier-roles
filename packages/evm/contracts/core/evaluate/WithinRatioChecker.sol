// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Adapter.sol";
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
     * Layout (12 or 52 bytes):
     * ┌─────────┬─────────┬─────────┬─────────┬──────────┬──────────┬─────────────────┬─────────────────┐
     * │  refIdx │ refDec  │ relIdx  │ relDec  │ minRatio │ maxRatio │   refAdapter    │   relAdapter    │
     * │ (uint8) │ (uint8) │ (uint8) │ (uint8) │ (uint32) │ (uint32) │    (address)    │    (address)    │
     * ├─────────┼─────────┼─────────┼─────────┼──────────┼──────────┼─────────────────┼─────────────────┤
     * │    0    │    1    │    2    │    3    │   4–7    │   8–11   │     12–31       │     32–51       │
     * └─────────┴─────────┴─────────┴─────────┴──────────┴──────────┴─────────────────┴─────────────────┘
     *                                                               └────────────── optional ──────────┘
     */
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

    uint256 private constant BPS = 10000;
    uint256 private constant PRICE_DECIMALS = 18;

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
        ) = _amounts(config, pluckedValues);
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
     * @dev Normalizes both amounts to a common precision and applies price conversion.
     */
    function _amounts(
        CompValue memory config,
        bytes32[] memory pluckedValues
    )
        private
        view
        returns (Status status, uint256 referenceAmount, uint256 relativeAmount)
    {
        uint256 precision = _max(
            _max(config.referenceDecimals, config.relativeDecimals),
            PRICE_DECIMALS
        );

        (status, referenceAmount) = _applyPrice(
            uint256(pluckedValues[config.referenceIndex]),
            config.referenceDecimals,
            config.referenceAdapter,
            precision
        );
        if (status != Status.Ok) {
            return (status, 0, 0);
        }

        (status, relativeAmount) = _applyPrice(
            uint256(pluckedValues[config.relativeIndex]),
            config.relativeDecimals,
            config.relativeAdapter,
            precision
        );
        if (status != Status.Ok) {
            return (status, 0, 0);
        }
    }

    /**
     * @dev Scales amount to target precision and applies price conversion.
     */
    function _applyPrice(
        uint256 amount,
        uint8 decimals,
        address adapter,
        uint256 precision
    ) private view returns (Status, uint256) {
        uint256 scaledUp = amount * (10 ** (precision - decimals));

        if (adapter == address(0)) {
            return (Status.Ok, scaledUp);
        }

        (Status status, uint256 price) = Adapter.getPrice(adapter);
        if (status != Status.Ok) {
            return (status, 0);
        }

        return (Status.Ok, (scaledUp * price) / (10 ** PRICE_DECIMALS));
    }

    function _unpack(
        bytes memory compValue
    ) private pure returns (CompValue memory config) {
        bytes32 packed = bytes32(compValue);

        config.referenceIndex = uint8(bytes1(packed));
        config.referenceDecimals = uint8(bytes1(packed << 8));
        config.relativeIndex = uint8(bytes1(packed << 16));
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

    function _max(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a : b;
    }
}
