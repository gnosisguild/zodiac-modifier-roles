// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

struct Bitmap {
    mapping(uint256 => uint256) payload;
}

struct BitmapBuffer {
    uint256[] payload;
}

enum ParameterType {
    Static,
    Dynamic,
    Tuple,
    Array,
    OneOf,
    Function
}

function _isNested(ParameterType _type) pure returns (bool) {
    return uint8(_type) >= uint8(ParameterType.Tuple);
}

enum Comparison {
    EqualTo,
    GreaterThan,
    LessThan,
    Matches,
    Some,
    Every
    //Subset
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

struct TypeTopology {
    ParameterType _type;
    TypeTopology[] children;
}

struct ParameterPayload {
    uint256 offset;
    uint256 size;
    bytes raw;
    ParameterPayload[] children;
}

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
}

struct Role {
    mapping(address => bool) members;
    mapping(address => TargetAddress) targets;
    mapping(bytes32 => Bitmap) functions;
    mapping(bytes32 => bytes32) compValue;
}
