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
    uint256 nodeIndex;
    Operator operator;
    bytes compValue;
    /// @dev Number of children that describe type structure (Tuple/Array fields).
    ///      Structural children come first; non-structural (And/Or/None logic) follow.
    uint256 sChildCount;
    Condition[] children;
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

struct Layout {
    Encoding encoding;
    Layout[] children;
    /// @dev Bytes to skip before ABI-encoded data begins (e.g., 4 for selector).
    uint256 leadingBytes;
    /// @dev True if this type is encoded inline (includes children)
    bool inlined;
}

struct LayoutFlat {
    uint256 parent;
    Encoding encoding;
}

struct Payload {
    uint256 location;
    uint256 size;
    Payload[] children;
    /* meta flags */
    bool inlined;
    bool variant;
    bool overflow;
}
