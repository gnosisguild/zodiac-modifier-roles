// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

/**
 * @title Types - a file that contains all of the type definitions used throughout
 * the Zodiac Roles Mod.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.pm>
 */
enum ParameterType {
    None,
    Static,
    Dynamic,
    Tuple,
    Array,
    AbiEncoded
}

enum Operator {
    // 00:    EMPTY EXPRESSION (default, always passes)
    //          paramType: Static / Dynamic
    //          🚫 children
    //          🚫 compValue
    /* 00: */ Whatever, // TODO maybe rename to Pass
    // ------------------------------------------------------------
    // 01-04: BOOLEAN EXPRESSIONS
    //          paramType: None
    //          ✅ children
    //          🚫 compValue
    /* 01: */ And,
    /* 02: */ Or,
    /* 03: */ Xor,
    /* 04: */ Not,
    // ------------------------------------------------------------
    // 05-16: COMPLEX EXPRESSIONS
    //          paramType: AbiEncoded / Tuple / Array,
    //          ✅ children
    //          🚫 compValue
    /* 05: */ Matches,
    /* 06: */ ArraySome,
    /* 07: */ ArrayEvery,
    /* 08: */ ArraySubset,
    /* 09: */ _ComplexPlaceholder09,
    /* 10: */ _ComplexPlaceholder10,
    /* 11: */ _ComplexPlaceholder11,
    /* 12: */ _ComplexPlaceholder12,
    /* 13: */ _ComplexPlaceholder13,
    /* 14: */ _ComplexPlaceholder14,
    /* 15: */ _ComplexPlaceholder15,
    /* 16: */ _ComplexPlaceholder16,
    // ------------------------------------------------------------
    // 17-31: COMPARISON EXPRESSIONS
    //          paramType: Static / Dynamic / Tuple / Array / AbiEncoded
    //          🚫 children
    //          ✅ compValue
    /* 17: */ EqualTo,
    /* 18: */ GreaterThan,
    /* 19: */ LessThan,
    /* 20: */ Bitmask,
    /* 21: */ _ComparisonPlaceholder21,
    /* 22: */ _ComparisonPlaceholder22,
    /* 23: */ _ComparisonPlaceholder23,
    /* 24: */ _ComparisonPlaceholder24,
    /* 25: */ _ComparisonPlaceholder25,
    /* 26: */ _ComparisonPlaceholder26,
    /* 27: */ _ComparisonPlaceholder27,
    /* 28: */ _ComparisonPlaceholder28,
    /* 29: */ WithinAllowance,
    /* 30: */ ETHWithinAllowance, // TODO ETH looks weird to me, it's not an acronym
    /* 31: */ CallWithinAllowance
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
    ParameterType paramType;
    Operator operator;
    bytes compValue;
}

struct Condition {
    ParameterType paramType;
    Operator operator;
    bytes32 compValue;
    Condition[] children;
}
struct ParameterPayload {
    uint256 location;
    uint256 size;
    ParameterPayload[] children;
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

struct Allowance {
    // refillInterval - duration of the period in seconds, 0 for one-time allowance
    // refillAmount - amount that will be replenished "at the start of every period" (replace with: per period)
    // refillTimestamp - timestamp of the last interval refilled for;
    // maxBalance - max accrual amount, replenishing stops once the unused allowance hits this value
    // balance - unused allowance;

    // order matters
    uint128 refillAmount;
    uint128 maxBalance;
    uint64 refillInterval;
    // only these these two fields are updated on accrual, should live in the same word
    uint128 balance;
    uint64 refillTimestamp;
}

struct Trace {
    Condition condition;
    uint256 value;
}
