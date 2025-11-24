// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Encodings.sol";

/**
 * @title Types - a file that contains all of the type definitions used throughout
 * the Zodiac Roles Mod.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */

enum Operator {
    // 00:    EMPTY EXPRESSION (default, always passes)
    //          paramType: Static / Dynamic / Tuple / Array
    //          ❓ children (only for paramType: Tuple / Array to describe their structure)
    //          🚫 compValue
    /* 00: */ Pass,
    // ------------------------------------------------------------
    // 01-04: LOGICAL EXPRESSIONS
    //          paramType: None
    //          ✅ children
    //          🚫 compValue
    /* 01: */ And,
    /* 02: */ Or,
    /* 03: */ _Placeholder03,
    /* 04: */ _Placeholder04,
    // ------------------------------------------------------------
    // 05-14: COMPLEX EXPRESSIONS
    //          paramType: Calldata / AbiEncoded / Tuple / Array,
    //          ✅ children
    //          🚫 compValue
    /* 05: */ Matches,
    /* 06: */ ArraySome,
    /* 07: */ ArrayEvery,
    /* 08: */ _Placeholder08,
    /* 09: */ _Placeholder09,
    /* 10: */ _Placeholder10,
    /* 11: */ _Placeholder11,
    /* 12: */ _Placeholder12,
    /* 13: */ _Placeholder13,
    /* 14: */ _Placeholder14,
    // ------------------------------------------------------------
    // 15:    SPECIAL COMPARISON (without compValue)
    //          paramType: Static
    //          🚫 children
    //          🚫 compValue
    /* 15: */ EqualToAvatar,
    // ------------------------------------------------------------
    // 16-31: COMPARISON EXPRESSIONS
    //          paramType: Static / Dynamic / Tuple / Array
    //          ❓ children (only for paramType: Tuple / Array to describe their structure)
    //          ✅ compValue
    /* 16: */ EqualTo, // paramType: Static / Dynamic / Tuple / Array
    /* 17: */ GreaterThan, // paramType: Static
    /* 18: */ LessThan, // paramType: Static
    /* 19: */ SignedIntGreaterThan, // paramType: Static
    /* 20: */ SignedIntLessThan, // paramType: Static
    /* 21: */ Bitmask, // paramType: Static / Dynamic
    /* 22: */ Custom, // paramType: Static / Dynamic / Tuple / Array
    /* 23: */ WithinRatio, // paramType: None
    /* 24: */ _Placeholder24,
    /* 25: */ _Placeholder25,
    /* 26: */ _Placeholder26,
    /* 27: */ _Placeholder27,
    /* 28: */ WithinAllowance, // paramType: Static
    /* 29: */ EtherWithinAllowance, // paramType: None
    /* 30: */ CallWithinAllowance, // paramType: None
    /* 31: */ _Placeholder31
}

enum ExecutionOptions {
    None,
    Send,
    DelegateCall,
    Both
}

enum Clearance {
    None,
    Target,
    Function
}

// This struct is a flattened version of Condition
// used for ABI encoding a scope config tree
// (ABI does not support recursive types)
struct ConditionFlat {
    uint8 parent;
    Encoding paramType;
    Operator operator;
    bytes compValue;
}

struct Condition {
    Encoding encoding;
    Operator operator;
    bytes compValue;
    uint256 sChildCount;
    Condition[] children;
}

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
}

struct Role {
    mapping(address => bool) members;
    mapping(address => TargetAddress) targets;
    mapping(bytes32 => bytes32) scopeConfig;
}

/// @notice The order of members in the `Allowance` struct is significant; members updated during accrual (`balance` and `timestamp`) should be stored in the same word.
/// @custom:member refill Amount added to balance after each period elapses.
/// @custom:member maxRefill Refilling stops when balance reaches this value.
/// @custom:member period Duration, in seconds, before a refill occurs. If set to 0, the allowance is for one-time use and won't be replenished.
/// @custom:member balance Remaining allowance available for use. Decreases with usage and increases after each refill by the specified refill amount.
/// @custom:member timestamp Timestamp when the last refill occurred.
struct Allowance {
    uint128 refill;
    uint128 maxRefill;
    uint64 period;
    uint128 balance;
    uint64 timestamp;
}

struct Consumption {
    bytes32 allowanceKey;
    uint128 balance;
    uint128 consumed;
}

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
    RatioAboveMax
}
