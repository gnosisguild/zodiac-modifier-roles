// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

import {Consumption} from "./Allowance.sol";
import {Payload} from "./Condition.sol";

enum Status {
    Ok,
    /// Or conition not met
    OrViolation,
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
    /// Bitmask exceeded value length
    BitmaskOverflow,
    /// Bitmask not an allowed value
    BitmaskNotAllowed,
    CustomConditionViolation,
    CustomConditionNotAContract,
    CustomConditionReverted,
    CustomConditionInvalidResult,
    PricingAdapterNotAContract,
    PricingAdapterReverted,
    PricingAdapterInvalidResult,
    PricingAdapterZeroPrice,
    AllowanceExceeded,
    /// Converted allowance value exceeds uint128 max
    AllowanceValueOverflow,
    CalldataOverflow,
    RatioBelowMin,
    RatioAboveMax,
    /// Calldata is not empty when it should be
    CalldataNotEmpty,
    /// Leading bytes do not match expected value
    LeadingBytesNotAMatch,
    /// Zipped arrays have different lengths
    ZippedArrayLengthMismatch,
    /// No zipped element pair passes
    NoZippedElementPasses
}

struct Transaction {
    address to;
    uint256 value;
    Operation operation;
}

struct Context {
    address to;
    uint256 value;
    Operation operation;
    bytes32[] pluckedValues;
    Payload[] pluckedPayloads;
}

struct Result {
    Status status;
    uint256 violatedNodeIndex;
    uint256 payloadLocation;
    uint256 payloadSize;
    Consumption[] consumptions;
}
