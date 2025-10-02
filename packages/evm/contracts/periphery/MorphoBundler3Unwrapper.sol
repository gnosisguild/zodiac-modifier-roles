// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

interface IBundler3 {
    struct Call {
        address to;
        bytes data;
        uint256 value;
        bool skipRevert;
        bytes32 callbackHash;
    }
    function multicall(Call[] calldata) external payable;
}

contract MorphoBundler3Unwrapper is ITransactionUnwrapper {
    error UnsupportedMode();
    error MalformedHeader();
    error MalformedBody();

    function unwrap(
        address,
        uint256,
        bytes calldata data,
        Operation operation
    ) external pure override returns (UnwrappedTransaction[] memory) {
        if (operation != Operation.Call) {
            revert UnsupportedMode();
        }

        return _unwrapEntries(data);
    }

    function _unwrapEntries(
        bytes calldata data
    ) private pure returns (UnwrappedTransaction[] memory result) {
        uint256 count = uint256(bytes32(data[36:]));
        result = new UnwrappedTransaction[](count);

        // 4 bytes -> selector
        // 32 bytes -> buffer offset
        // 32 bytes -> buffer length
        uint256 headLocation = 4 + 32 + 32;
        for (uint256 i = 0; i < count; ++i) {
            _unwrapEntry(data, _tail(data, headLocation, i), result[i]);
        }
    }

    function _unwrapEntry(
        bytes calldata data,
        uint256 location,
        UnwrappedTransaction memory result
    ) private pure {
        result.operation = Operation.Call;

        // TO -> head slot 0, inline
        result.to = address(bytes20(data[location + 12:]));

        // DATA -> head slot 1, offset
        result.dataLocation = _tail(data, location, 1) + 32;
        result.dataSize = uint256(bytes32(data[_tail(data, location, 1):]));

        // VALUE -> head slot 2, inline
        result.value = uint256(bytes32(data[location + 64:]));
    }

    function _tail(
        bytes calldata data,
        uint256 headLocation,
        uint256 slot
    ) private pure returns (uint256 location) {
        uint offset = uint256(bytes32(data[headLocation + 32 * slot:]));
        location = headLocation + offset;
    }
}
