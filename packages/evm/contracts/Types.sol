// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

/**
 * @title Types - a file that contains all of the type definitions used throughout
 * the Zodiac Roles Mod.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */

/**
 * @dev Represents the key type for ABI encoding
 */
enum AbiType {
    None,
    Static,
    Dynamic,
    Tuple,
    Array,
    Calldata, // AKA AbiEncodedWithSelector,
    AbiEncoded
}

/**
 * @dev Structure representing an ABI type definition
 * @param key The type key indicating how this parameter should be encoded
 * @param fields Array of indices pointing to child types in the AbiType array
 */
struct AbiTypeTree {
    AbiType _type;
    uint256[] fields;
}

/**
 * @dev Structure that maps the location and size of a parameter in calldata
 * @param index The index of the parameter in the AbiType array
 * @param location The location of the parameter in calldata
 * @param size The size of the parameter in bytes
 * @param children Array of child payloads for complex types (tuples, arrays)
 */
struct Payload {
    uint256 index;
    uint256 location;
    uint256 size;
    Payload[] children;
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
    AbiType paramType;
    Operator operator;
    bytes compValue;
}

struct Condition {
    AbiType paramType;
    Operator operator;
    bytes32 compValue;
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
