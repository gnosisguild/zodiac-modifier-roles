// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

contract MultiSendAdapter is ITransactionUnwrapper {
    bytes4 private constant SELECTOR = 0x8d80ff0a;
    uint256 private constant OFFSET_START = 68;

    error MultiSendMalformed();

    function unwrap(
        bytes calldata data
    ) external pure returns (UnwrappedTransaction[] memory result) {
        _validateHeader(data);
        uint256 txCount = _validateBody(data);
        result = new UnwrappedTransaction[](txCount);

        uint256 offset = OFFSET_START;
        for (uint256 i; i < txCount; ++i) {
            (offset, result[i]) = _unwrapTx(data, offset);
        }
    }

    function _validateHeader(bytes calldata data) private pure {
        if (bytes4(data) != SELECTOR) {
            revert MultiSendMalformed();
        }

        if (bytes32(data[4:]) != bytes32(uint256(0x20))) {
            revert MultiSendMalformed();
        }

        uint256 length = uint256(bytes32(data[36:]));
        // padded to 32 bytes
        if (length + 32 + 32 + 4 > data.length) {
            revert MultiSendMalformed();
        }
    }

    function _validateBody(
        bytes calldata data
    ) private pure returns (uint256 count) {
        uint256 offset = OFFSET_START;

        // data is padded to 32 bytes we can't simply do offset < data.length
        for (; offset + 32 < data.length; ) {
            // Per transaction:
            // Operation   1  bytes
            // To          20 bytes
            // Value       32 bytes
            // Length      32 bytes
            // Data        Length bytes

            uint8 operation = uint8(bytes1(data[offset:]));
            if (operation > 1) {
                revert MultiSendMalformed();
            }

            uint256 length = uint256(bytes32(data[offset + 53:]));
            if (offset + 85 + length > data.length) {}

            offset += 85 + length;
            count++;
        }

        if (count == 0) {
            revert MultiSendMalformed();
        }
    }

    function _unwrapTx(
        bytes calldata data,
        uint256 offset
    ) private pure returns (uint256, UnwrappedTransaction memory result) {
        result.operation = Enum.Operation(uint8(bytes1(data[offset:])));
        offset += 1;

        result.to = address(bytes20(data[offset:]));
        offset += 20;

        result.value = uint256(bytes32(data[offset:]));
        offset += 32;

        uint256 length = uint256(bytes32(data[offset:]));
        offset += 32;

        result.dataOffset = offset;
        result.dataLength = length;

        return (offset + length, result);
    }
}
