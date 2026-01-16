// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

struct TopologyInfo {
    uint256 childStart;
    uint256 childCount;
    uint256 sChildCount;
    bytes32 typeHash;
    bool isStructural;
    bool isVariant;
    bool atOffset;
}
