// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

enum Clearance {
    None,
    Target,
    Function
}

enum ExecutionOptions {
    None,
    Send,
    DelegateCall,
    Both
}

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
}

struct RoleMembership {
    uint64 start;
    uint64 end;
    uint64 usesLeft;
}

struct Role {
    mapping(address => RoleMembership) members;
    mapping(address => TargetAddress) targets;
    mapping(bytes32 => bytes32) scopeConfig;
}
