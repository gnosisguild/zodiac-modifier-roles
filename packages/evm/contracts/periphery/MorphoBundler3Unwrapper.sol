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
        uint256 value,
        bytes calldata data,
        Operation operation
    ) external pure override returns (UnwrappedTransaction[] memory) {
        _validate(value, data, operation);
        return _unwrapEntries(data);
    }

    function _validate(
        uint256 value,
        bytes calldata data,
        Operation operation
    ) internal pure {
        if (value != 0) {
            revert UnsupportedMode();
        }
        if (operation != Operation.Call) {
            revert UnsupportedMode();
        }

        // first 4 bytes are the selector for multicall
        if (bytes4(data) != IBundler3.multicall.selector) {
            revert MalformedHeader();
        }

        // the following 32 bytes are the offset to the bytes param (always 0x20)
        if (bytes32(data[4:]) != bytes32(uint256(0x20))) {
            revert MalformedHeader();
        }

        uint256 count = uint256(bytes32(data[36:]));
        uint256 size = 68;
        for (uint256 i; i < count; i++) {
            size += 32 + _entrySize(data, _tail(data, 68, i));
        }

        if (size != data.length) {
            revert MalformedBody();
        }
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

    function _entrySize(
        bytes calldata data,
        uint256 location
    ) private pure returns (uint256) {
        uint256 headSize = 5 * 32;
        uint256 tailSize = 32 +
            _ceil32(uint256(bytes32(data[_tail(data, location, 1):])));
        return headSize + tailSize;
    }

    function _tail(
        bytes calldata data,
        uint256 headLocation,
        uint256 slot
    ) private pure returns (uint256 location) {
        uint256 slotLocation = headLocation + 32 * slot;
        if (slotLocation + 32 > data.length) {
            revert MalformedBody();
        }
        uint offset = uint256(bytes32(data[slotLocation:]));
        location = headLocation + offset;
    }

    function _ceil32(uint256 length) private pure returns (uint256) {
        return ((length + 32 - 1) / 32) * 32;
    }
}
