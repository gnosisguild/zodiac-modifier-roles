// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    constructor() ERC721("MockErc721", "NFTPOS") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function doSomething(uint256 tokenId, uint256 someParam) external {}
}
