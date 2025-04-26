// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

interface IMultiSend {
    function multiSend(bytes memory transactions) external payable;
}

struct UnwrappedTransaction {
    Operation operation;
    address to;
    uint256 value;
    // We wanna deal in calldata slices. We return location, let invoker slice
    uint256 dataLocation;
    uint256 dataSize;
}

interface ITransactionUnwrapper {
    function unwrap(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) external view returns (UnwrappedTransaction[] memory result);
}

interface ICustomCondition {
    function check(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 location,
        uint256 size,
        bytes12 extra
    ) external view returns (bool success, bytes32 reason);
}
