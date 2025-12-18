// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Allowance} from "../../types/Allowance.sol";
import "../../common/AllowanceLoader.sol";

/**
 * @title MockAllowanceAccrual
 * @notice Test contract that exposes AllowanceLoader accrual functions
 */
contract MockAllowanceAccrual {
    function accrue(
        Allowance memory allowance,
        uint64 blockTimestamp
    ) external pure returns (uint128 balance, uint64 timestamp) {
        return AllowanceLoader.accrue(allowance, blockTimestamp);
    }
}
