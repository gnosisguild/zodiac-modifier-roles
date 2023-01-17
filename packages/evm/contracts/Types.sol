// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

enum ParameterType {
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
    Matches,
    Some,
    Every
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

struct ParameterConfigFlat {
    bool isScoped;
    uint8[] path;
    ParameterType _type;
    Comparison comp;
    bytes[] compValues;
}

struct ParameterConfig {
    bool isScoped;
    ParameterType _type;
    Comparison comp;
    bytes32[] compValues;
    ParameterConfig[] children;
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
