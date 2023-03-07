// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Allowance.sol";

struct BitmapBuffer {
    bytes32[] payload;
}

enum ParameterType {
    Static,
    Dynamic,
    Tuple,
    Array,
    Function
}

enum Comparison {
    Whatever,
    Matches,
    Subset,
    EqualTo,
    GreaterThan,
    LessThan,
    WithinAllowance,
    OneOf,
    Bitmask,
    ArraySome,
    ArrayEvery
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
    uint16 parent;
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
    mapping(bytes32 => bytes32) compValues;
}

struct Tracking {
    ParameterConfig config;
    bytes32 value;
}
