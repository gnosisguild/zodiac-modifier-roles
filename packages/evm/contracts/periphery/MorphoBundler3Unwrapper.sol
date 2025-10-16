// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";
import "hardhat/console.sol";

/**
 * @title MorphoBundler3Unwrapper - An adapter that unwraps Morpho Bundler3 multicalls
 *
 * @author gnosisguild
 *
 */

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

    /**
     * @notice Unwraps a bundler3 multicall transaction into individual operations
     * @param
     * @param value ETH value sent with the call
     * @param data Bundler3 encoded multicall calldata
     * @param operation Operation type (must be Operation.Call)
     * @return result Array of unwrapped transactions
     */
    function unwrap(
        address,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) external pure override returns (UnwrappedTransaction[] memory) {
        _validate(value, data, operation);
        return _unwrapEntries(data);
    }

    /**
     * @notice Validates the overall structure of the multicall calldata
     * @dev Ensures selector, offsets, and sizes match expected layout
     */
    function _validate(
        uint256 value,
        bytes calldata data,
        Operation operation
    ) internal pure {
        // Only zero-value calls are supported
        if (value != 0) {
            revert UnsupportedMode();
        }

        // Only Operation.Call is supported
        if (operation != Operation.Call) {
            revert UnsupportedMode();
        }

        // First 4 bytes must be the multicall selector
        if (bytes4(data) != IBundler3.multicall.selector) {
            revert MalformedHeader();
        }

        // Next 32 bytes should be the offset to payload (always 0x20)
        if (bytes32(data[4:]) != bytes32(uint256(0x20))) {
            revert MalformedHeader();
        }

        // 4 (selector) + 32 (offset) + 32 (array length)
        uint256 size = 68;
        uint256 length = uint256(bytes32(data[36:]));

        // Calculate expected total size based on each entry
        for (uint256 i; i < length; i++) {
            size += 32 + _entrySize(data, _tail(data, 68, i));
        }

        console.log(size);
        console.log(data.length);

        // Total length must match calldata
        if (size != data.length) {
            revert MalformedBody();
        }
    }

    function _unwrapEntries(
        bytes calldata data
    ) private pure returns (UnwrappedTransaction[] memory result) {
        uint256 count = uint256(bytes32(data[36:])); // number of calls
        result = new UnwrappedTransaction[](count);

        // Offset to start of head section: selector (4) + buffer offset (32) + array length (32)
        uint256 headLocation = 4 + 32 + 32;

        // Loop through each entry
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

        // Head Slot 0 Inline: To -> address are rightmost 20 bytes of the slot
        result.to = address(bytes20(data[location + 12:]));

        // Head Slot 1 Offset: Data
        uint256 slot1Location = _tail(data, location, 1);
        result.dataLocation = slot1Location + 32;
        result.dataSize = uint256(bytes32(data[slot1Location:]));

        // Head Slot 2 Inline: Value
        result.value = uint256(bytes32(data[location + 64:]));
    }

    function _entrySize(
        bytes calldata data,
        uint256 location
    ) private pure returns (uint256) {
        uint256 headSize = 5 * 32; // 5 slots in the head
        uint256 tailSize = 32 + // 32 bytes for data length
            _ceil32(uint256(bytes32(data[_tail(data, location, 1):]))); // padded data
        return headSize + tailSize;
    }

    /**
     * @notice Returns the absolute calldata location of a non-inline slot
     *
     * @dev A non-inline slot, is one that's not encoded inline at head. Rather
     *      contains an offset pointing to its corresponding tail region where
     *      data is encoded.
     * @param data Full calldata buffer
     * @param headLocation Starting position of the head block
     * @param slot Index of the slot within the head block
     * @return location Absolute location of the data
     */
    function _tail(
        bytes calldata data,
        uint256 headLocation,
        uint256 slot
    ) private pure returns (uint256 location) {
        if ((headLocation + 32 * slot) + 32 > data.length) {
            revert MalformedBody();
        }
        uint256 offset = uint256(bytes32(data[headLocation + 32 * slot:]));
        location = headLocation + offset;
    }

    /**
     * @notice Rounds a length up to the nearest multiple of 32 bytes
     */
    function _ceil32(uint256 length) private pure returns (uint256) {
        return ((length + 32 - 1) / 32) * 32;
    }
}
