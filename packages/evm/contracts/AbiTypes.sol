// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

enum AbiType {
    None,
    Static,
    Dynamic,
    Tuple,
    Array,
    Calldata, // AKA AbiEncodedWithSelector,
    AbiEncoded
}

struct TypeTreeFlat {
    AbiType _type;
    uint256[] fields;
}

/**
 * @dev Structure representing an ABI type definition
 * @param key The type key indicating how this parameter should be encoded
 * @param fields Array of indices pointing to child types in the AbiType array
 */
struct TypeTree {
    AbiType _type;
    uint256 bfsIndex;
    TypeTree[] children;
}

/**
 * @dev Structure that maps the location and size of a parameter in calldata
 * @param index The index of the parameter in the AbiType array
 * @param location The location of the parameter in calldata
 * @param size The size of the parameter in bytes
 * @param children Array of child payloads for complex types (tuples, arrays)
 */
struct Payload {
    bool variant;
    bool overflown;
    uint256 index;
    uint256 location;
    uint256 size;
    Payload[] children;
}
