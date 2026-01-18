// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

struct Topology {
    uint256 childStart;
    uint256 childCount;
    uint256 sChildCount;
    bool isNotInline;
    bool isVariant;
    bool isInLayout;
}
