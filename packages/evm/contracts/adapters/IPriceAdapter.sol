// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

/**
 * @notice Interface for price adapters
 * @dev Returns a price with 18 decimals precision
 */
interface IPriceAdapter {
    function getPrice() external view returns (uint256 price);
}
