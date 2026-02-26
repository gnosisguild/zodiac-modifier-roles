// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    constructor() ERC721("MockErc721", "NFTPOS") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function doSomething(uint256 tokenId, uint256 someParam) external {}
}
