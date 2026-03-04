// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

contract MockUniswapV3PoolOracle {
    address public immutable token0;
    address public immutable token1;

    int56 public tickCumulativeDelta;

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    function setTickCumulativeDelta(int56 delta) external {
        tickCumulativeDelta = delta;
    }

    function observe(
        uint32[] calldata
    ) external view returns (int56[] memory, uint160[] memory) {
        int56[] memory ticks = new int56[](2);
        ticks[0] = 0;
        ticks[1] = tickCumulativeDelta;

        uint160[] memory liquidity = new uint160[](2);
        return (ticks, liquidity);
    }
}
