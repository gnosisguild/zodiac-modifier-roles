// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "../Base.t.sol";

/// @title Big Condition Scenario Tests
/// @notice Stub file for large condition tree tests. Skipped by default
///         as these are resource-intensive and intended for manual runs.
contract BigConditionTest is BaseTest {
    function test_bigCondition_skippedByDefault() public {
        vm.skip(true);
    }
}
