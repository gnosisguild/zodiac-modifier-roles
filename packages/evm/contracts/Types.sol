// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

enum ParameterType {
    None,
    Static,
    Dynamic,
    Dynamic32
}

enum Comparison {
    EqualTo,
    GreaterThan,
    LessThan,
    OneOf
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
    bool isScoped;
    ParameterType _type;
    Comparison comp;
    bytes[] compValues;
}

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
    uint16 scopeSetId;
}

struct Role {
    mapping(address => bool) members;
    mapping(address => TargetAddress) targets;
}

struct ScopeSet {
    bool created;
    bool revoked;
    mapping(bytes4 => uint256) functions;
    mapping(bytes32 => bytes32[]) compValues;
}
