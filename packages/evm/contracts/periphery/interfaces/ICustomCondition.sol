// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

interface ICustomCondition {
    function check(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 location,
        uint256 size,
        bytes calldata extra,
        bytes32[] memory pluckedValues
    ) external view returns (bool success);
}
