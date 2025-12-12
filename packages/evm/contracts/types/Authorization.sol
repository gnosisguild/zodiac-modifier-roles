// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

import {Consumption} from "./Allowance.sol";

enum Status {
    Ok,
    /// Role not allowed to delegate call to target address
    DelegateCallNotAllowed,
    /// Role not allowed to call target address
    TargetAddressNotAllowed,
    /// Role not allowed to call this function on target address
    FunctionNotAllowed,
    /// Role not allowed to send to target address
    SendNotAllowed,
    /// Or conition not met
    OrViolation,
    /// @deprecated Nor operator has been removed
    _DeprecatedNorViolation,
    /// Parameter value is not equal to allowed
    ParameterNotAllowed,
    /// Parameter value less than allowed
    ParameterLessThanAllowed,
    /// Parameter value greater than maximum allowed by role
    ParameterGreaterThanAllowed,
    /// Parameter value does not match
    ParameterNotAMatch,
    /// Array elements do not meet allowed criteria for every element
    NotEveryArrayElementPasses,
    /// Array elements do not meet allowed criteria for at least one element
    NoArrayElementPasses,
    /// @deprecated ArraySubset operator has been removed
    _DeprecatedParameterNotSubsetOfAllowed,
    /// Bitmask exceeded value length
    BitmaskOverflow,
    /// Bitmask not an allowed value
    BitmaskNotAllowed,
    CustomConditionViolation,
    AllowanceExceeded,
    CallAllowanceExceeded,
    EtherAllowanceExceeded,
    CalldataOverflow,
    RatioBelowMin,
    RatioAboveMax,
    /// Calldata is not empty when it should be
    CalldataNotEmpty
}

struct Context {
    address to;
    uint256 value;
    Operation operation;
}

struct Result {
    Status status;
    Consumption[] consumptions;
    bytes32 info;
}
