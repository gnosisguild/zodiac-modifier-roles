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

struct Role {
    mapping(address => uint256) members;
    mapping(address => Clearance) clearance;
    mapping(bytes32 => bytes32) scopeConfig;
}
