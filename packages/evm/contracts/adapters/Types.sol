// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

struct UnwrappedTransaction {
    Enum.Operation operation;
    address to;
    uint256 value;
    // We wanna deal in calldata slices. We return location, let invoker slice
    uint256 dataOffset;
    uint256 dataLength;
}

interface ITransactionUnwrapper {
    function unwrap(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external view returns (UnwrappedTransaction[] memory result);
}
