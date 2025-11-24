// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Encoding.sol";
import "./Operator.sol";

// This struct is a flattened version of Condition
// used for ABI encoding a scope config tree
// (ABI does not support recursive types)
struct ConditionFlat {
    uint8 parent;
    Encoding paramType;
    Operator operator;
    bytes compValue;
}
