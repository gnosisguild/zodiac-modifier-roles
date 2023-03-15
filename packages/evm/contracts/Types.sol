// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

enum ParameterType {
    None,
    Static,
    Dynamic,
    Tuple,
    Array,
    AbiEncoded
}

enum Comparison {
    Whatever,
    Matches,
    And,
    Or,
    SubsetOf,
    ArraySome,
    ArrayEvery,
    // comparison types above don't use compValue
    // ---
    // comparison types below use compValue 
    EqualTo,
    GreaterThan,
    LessThan,
    Bitmask,
    WithinAllowance
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

struct TypeTopology {
    ParameterType _type;
    TypeTopology[] children;
}

struct ParameterConfigFlat {
    uint8 parent;
    ParameterType _type;
    Comparison comp;
    bytes compValue;
}

struct ParameterConfig {
    ParameterType _type;
    Comparison comp;
    bool isHashed;
    bytes32 compValue;
    uint256 allowance;
    ParameterConfig[] children;
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
    ParameterConfig config;
    bytes32 value;
}
