// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "../interfaces/IPricing.sol";
import "./interfaces/IUniswapV3PoolOracle.sol";
import "./libraries/TickMath.sol";

/**
 * @title UniswapPricing
 * @notice Generic pricing adapter using Uniswap V3 TWAP.
 * @dev Params are encoded as `(address pool, bool invert)`.
 *      The returned value is token1/token0 scaled to 1e18.
 */
contract UniswapPricing is IPricing {
    uint256 private constant ONE = 1e18;
    uint256 private constant Q192 = 2 ** 192;

    uint32 public immutable twapWindow;

    error InvalidSource();
    error InvalidWindow();
    error InvalidPool();
    error ZeroPrice();

    constructor(uint32 _twapWindow) {
        if (_twapWindow == 0) revert InvalidWindow();
        twapWindow = _twapWindow;
    }

    /// @inheritdoc IPricing
    function getPrice(bytes calldata params) external view returns (uint256 price) {
        (address source, bool invert) = abi.decode(params, (address, bool));
        if (source == address(0)) revert InvalidSource();

        IUniswapV3PoolOracle pool = IUniswapV3PoolOracle(source);

        // Basic sanity check that source behaves as a pool.
        address token0 = pool.token0();
        address token1 = pool.token1();
        if (token0 == address(0) || token1 == address(0) || token0 == token1) {
            revert InvalidPool();
        }

        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = twapWindow;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);

        int56 delta = tickCumulatives[1] - tickCumulatives[0];
        int24 arithmeticMeanTick = int24(delta / int56(uint56(twapWindow)));

        // Round toward negative infinity to match Uniswap OracleLibrary behavior.
        if (delta < 0 && (delta % int56(uint56(twapWindow)) != 0)) {
            arithmeticMeanTick--;
        }

        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);
        uint256 ratioX192 = uint256(sqrtPriceX96) * uint256(sqrtPriceX96);

        uint256 forward = Math.mulDiv(ratioX192, ONE, Q192);
        if (forward == 0) revert ZeroPrice();

        if (invert) {
            price = Math.mulDiv(ONE, ONE, forward);
            if (price == 0) revert ZeroPrice();
        } else {
            price = forward;
        }
    }
}
