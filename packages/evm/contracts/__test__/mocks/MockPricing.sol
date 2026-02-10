// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 GG DAO LLC
// Zodiac Roles Modifier v3
// Converts to LGPL-3.0-or-later on 2030-03-01
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

/// @dev Contract with code but no getPrice() and no fallback
contract MockPricingNoInterface {
    function dummy() external pure returns (uint256) {
        return 42;
    }
}

/// @dev Contract that implements IPricing but always reverts
contract MockPricingReverting {
    function getPrice() external pure returns (uint256) {
        revert("MockPricing: intentional revert");
    }
}

/// @dev Contract with matching selector but wrong return type
contract MockPricingWrongReturn {
    function getPrice() external pure returns (uint256, uint256) {
        return (123, 456);
    }
}
