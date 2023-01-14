// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

enum ParameterType {
    None,
    Static,
    Dynamic,
    Dynamic32,
    Tuple,
    Array
}

enum Comparison {
    EqualTo,
    GreaterThan,
    LessThan,
    OneOf,
    SubsetOf,
    TupleMatches,
    ArraySome,
    ArrayEvery,
    ArrayMatches
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

struct ParameterConfig {
    uint8[] path;
    ParameterType _type;
    Comparison comp;
    bytes[] compValues;
}

struct ParameterConfigTree {
    bool isScoped;
    ParameterType _type;
    Comparison comp;
    bytes[] compValues;
    ParameterConfigTree[] children;
}

struct ParameterLayout {
    bool isScoped;
    ParameterType _type;
    Comparison comp;
    ParameterLayout[] nested;
}

struct ParameterPayload {
    bytes32 _static;
    bytes dynamic;
    bytes32[] dynamic32;
    ParameterPayload[] children;
}

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
}

struct Role {
    mapping(address => bool) members;
    mapping(address => TargetAddress) targets;
    mapping(bytes32 => uint256) functions;
    mapping(bytes32 => bytes32) compValue;
    mapping(bytes32 => bytes32[]) compValues;
}
