// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

struct Payload {
    uint256 location;
    uint256 size;
    Payload[] children;
    bool variant;
    bool overflown;
    uint256 typeIndex;
}
