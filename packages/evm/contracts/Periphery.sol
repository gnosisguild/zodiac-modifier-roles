// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./adapters/Types.sol";

abstract contract Periphery is OwnableUpgradeable {
    event SetUnwrapAdapter(
        address to,
        bytes4 selector,
        ITransactionUnwrapper adapter
    );

    mapping(bytes32 => ITransactionUnwrapper) public unwrappers;

    function setTransactionUnwrapper(
        address to,
        bytes4 selector,
        ITransactionUnwrapper adapter
    ) external onlyOwner {
        unwrappers[
            bytes32(bytes20(to)) | (bytes32(selector) >> (160))
        ] = adapter;
        emit SetUnwrapAdapter(to, selector, adapter);
    }

    function getTransactionUnwrapper(
        address to,
        bytes4 selector
    ) internal view returns (ITransactionUnwrapper) {
        /*
         *
         * Unoptimized version of
         * bytes32(abi.encodePacked(to, bytes4(data)))
         *
         */
        return unwrappers[bytes32(bytes20(to)) | (bytes32(selector) >> (160))];
    }
}
