// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

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
    EqualTo,
    GreaterThan,
    LessThan,
    OneOf,
    Matches,
    Some,
    Every,
    Subset
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
    bool isScoped;
    uint16 parent;
    ParameterType _type;
    Comparison comp;
    bytes compValue;
}

struct ParameterConfig {
    bool isScoped;
    ParameterType _type;
    Comparison comp;
    bytes32 compValue;
    ParameterConfig[] children;
}
struct ParameterPayload {
    uint256 location;
    uint256 size;
    bytes raw;
    ParameterPayload[] children;
}

struct Tracking {
    ParameterConfig config;
    ParameterPayload payload;
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
