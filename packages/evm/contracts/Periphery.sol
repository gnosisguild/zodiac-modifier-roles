// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./adapters/Types.sol";

abstract contract Periphery is OwnableUpgradeable {
    event SetUnwrapAdapter(address to, address adapter);

    mapping(address => address) public unwrappers;

    function setUnwrapAdapter(address to, address adapter) external onlyOwner {
        unwrappers[to] = adapter;

        emit SetUnwrapAdapter(to, adapter);
    }
}
