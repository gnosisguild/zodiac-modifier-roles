// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

contract MockPricing {
    uint256 private immutable _price;

    constructor(uint256 price) {
        _price = price;
    }

    function getPrice() external view returns (uint256) {
        return _price;
    }
}
