// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./adapters/Types.sol";

abstract contract Periphery is OwnableUpgradeable {
    event SetUnwrapAdapter(address to, address adapter);

    mapping(bytes32 => address) public unwrappers;

    function setUnwrapAdapter(
        address to,
        bytes4 selector,
        address adapter
    ) external onlyOwner {
        unwrappers[bytes32(abi.encodePacked(to, selector))] = adapter;
        emit SetUnwrapAdapter(to, adapter);
    }
}
