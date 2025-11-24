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
