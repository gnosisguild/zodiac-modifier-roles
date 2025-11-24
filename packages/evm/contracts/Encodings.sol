// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

enum Encoding {
    None,
    Static,
    Dynamic,
    Tuple,
    Array,
    Calldata, // AKA AbiEncodedWithSelector,
    AbiEncoded
}

struct LayoutFlat {
    Encoding _type;
    uint256[] fields;
}

/**
 * @dev Structure representing an ABI type definition in a hierarchical tree
 * @param _type The ABI type category (Static, Dynamic, Tuple, Array, etc.)
 * @param children Array of child Layout nodes for complex types (tuples, arrays)
 * @param index bfs order from the original flat LayoutFlat representation
 */
struct Layout {
    Encoding _type;
    Layout[] children;
    uint256 index;
}

/**
 * @dev Structure that maps the location and size of a parameter in calldata
 * @param location The location of the parameter in calldata
 * @param size The size of the parameter in bytes
 * @param children Array of child payloads for complex types (tuples, arrays)
 * @param variant Indicates this node represents an OR/AND/NOR variant branch container where multiple type interpretations are attempted
 * @param overflown true if decoding failed due to insufficient calldata or invalid offsets
 * @param typeIndex The breadth-first search index from the original flat LayoutFlat representation, used to correlate decoded payloads back to their type definitions
 */
struct Payload {
    uint256 location;
    uint256 size;
    Payload[] children;
    /* meta fields */
    bool variant;
    bool overflown;
    uint256 typeIndex;
}
