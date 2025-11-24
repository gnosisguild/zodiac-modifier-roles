// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Clearance.sol";
import "./ExecutionOptions.sol";

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
}
