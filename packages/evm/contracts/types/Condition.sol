// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import {Operator} from "./Operator.sol";

enum Encoding {
    None,
    Static,
    Dynamic,
    Tuple,
    Array,
    AbiEncoded,
    /* EtherValue is a nonstructural, and an alias for None */
    EtherValue
}

struct Condition {
    /// @dev BFS index from unpacking - identifies this node in the flattened tree
    uint256 index;
    Operator operator;
    bytes compValue;
    Condition[] children;
    Payload payload;
}

// This struct is a flattened version of Condition
// used for ABI encoding a scope config tree
// (ABI does not support recursive types)
struct ConditionFlat {
    uint16 parent;
    Encoding paramType;
    Operator operator;
    bytes compValue;
}

/// @dev Payload describes how to decode this node's data from calldata.
///      Set during unpacking from storage.
struct Payload {
    Encoding encoding;
    uint256 leadingBytes;
    bool inlined;
    uint256 size; // If non-zero, use this size instead of calling AbiDecoder (e.g., for Slice)
}

/// @dev Layout is a type tree used for EIP712 encoding and type hashing.
///      Built at runtime by TypeTree library.
struct Layout {
    Encoding encoding;
    bool inlined;
    Layout[] children;
}

struct LayoutFlat {
    uint256 parent;
    Encoding encoding;
}
