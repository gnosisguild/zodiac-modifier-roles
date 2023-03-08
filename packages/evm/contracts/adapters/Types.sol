// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

struct UnwrappedTransaction {
    Enum.Operation operation;
    address to;
    uint256 value;
    // We wanna deal in calldata slices. We return location, let invoker slice
    Location location;
}
struct Location {
    uint256 left;
    uint256 right;
}

interface IUnwrappingAdapter {
    function unwrap(
        bytes calldata data
    ) external view returns (UnwrappedTransaction[] memory result);
}
