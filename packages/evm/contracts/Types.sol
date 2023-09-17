// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

/**
 * @title Types - a file that contains all of the type definitions used throughout
 * the Zodiac Roles Mod.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */
enum ParameterType {
    None,
    Static,
    Dynamic,
    Tuple,
    Array,
    Calldata,
    AbiEncoded
}

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
    /* 03: */ Nor,
    /* 04: */ _Placeholder04,
    // ------------------------------------------------------------
    // 05-14: COMPLEX EXPRESSIONS
    //          paramType: Calldata / AbiEncoded / Tuple / Array,
    //          ✅ children
    //          🚫 compValue
    /* 05: */ Matches,
    /* 06: */ ArraySome,
    /* 07: */ ArrayEvery,
    /* 08: */ ArraySubset,
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
    /* 23: */ _Placeholder23,
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
    /*
     * period:     Duration, in seconds, before a refill occurs. If set to 0, the allowance is
     *             for one-time use and won't be replenished.
     *
     * refill:     Amount added to balance after each period elapses.
     *
     * timestamp:  Records the moment when the last refill occurred.
     *
     * maxBalance: Maximum allowable accumulated allowance. Refill stops when unused allowance
     *             reaches this value.
     *
     * balance:    Remaining, unused allowance available for use. It decreases with usage and
     *             increases after each refill according to the specified refill amount.
     */

    // The order is significant; fields updated during accrual are on the second word.
    uint128 refill; // Amount added per accrual.
    uint128 maxBalance; // Maximum allowable accumulated amount.
    uint64 period; // Duration before a refill occurs.
    // These two fields are the only ones updated during accrual and should reside in the same word.
    uint128 balance; // Remaining unused amount.
    uint64 timestamp; // Timestamp of the last refilled period.
}

struct Consumption {
    bytes32 allowanceKey;
    uint128 balance;
    uint128 consumed;
}
