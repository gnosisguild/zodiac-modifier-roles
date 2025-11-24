// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

struct Consumption {
    bytes32 allowanceKey;
    uint128 balance;
    uint128 consumed;
}
