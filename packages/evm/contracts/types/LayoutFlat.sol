// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Encoding.sol";

struct LayoutFlat {
    Encoding encoding;
    uint256[] fields;
}
