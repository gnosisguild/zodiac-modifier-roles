// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Operator.sol";

struct Condition {
    Operator operator;
    bytes compValue;
    uint256 sChildCount;
    Condition[] children;
}
