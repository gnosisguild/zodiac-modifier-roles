// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../../contracts/__test__/fixtures/MultiSend.sol";
import "../../../contracts/periphery/unwrappers/MultiSendUnwrapper.sol";
import "../../../contracts/periphery/interfaces/ITransactionUnwrapper.sol";
import "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

/// @title MultiSendUnwrapper Tests
/// @notice Verifies the MultiSendUnwrapper correctly validates and unwraps
///         multisend calldata.
contract MultisendUnwrapperTest is Test {
    MultiSendUnwrapper internal unwrapper;
    address internal targetA;
    address internal targetB;

    function setUp() public {
        unwrapper = new MultiSendUnwrapper();
        targetA = makeAddr("targetA");
        targetB = makeAddr("targetB");
    }

    // =========================================================================
    // Error Cases
    // =========================================================================

    function test_revertsWrongSelector() public {
        // Build calldata with wrong selector
        bytes memory data = abi.encodeWithSelector(bytes4(0xdeadbeef), bytes(""));

        vm.expectRevert(MultiSendUnwrapper.MalformedHeader.selector);
        unwrapper.unwrap(address(0), 0, data, Operation.DelegateCall);
    }

    function test_revertsIncorrectOffset() public {
        // Build calldata with correct selector but wrong offset
        bytes memory payload = _encodeSingleTx(targetA, 0, 0, hex"aabbccdd");
        bytes memory data = abi.encodePacked(
            MultiSend.multiSend.selector,
            bytes32(uint256(0x40)), // wrong offset, should be 0x20
            bytes32(payload.length),
            payload
        );
        // Pad to 32 bytes
        uint256 padLen = _ceil32(data.length) - data.length;
        if (padLen > 0) {
            data = abi.encodePacked(data, new bytes(padLen));
        }

        vm.expectRevert(MultiSendUnwrapper.MalformedHeader.selector);
        unwrapper.unwrap(address(0), 0, data, Operation.DelegateCall);
    }

    function test_revertsIncorrectLength() public {
        // Build calldata with correct selector and offset but wrong declared length
        bytes memory payload = _encodeSingleTx(targetA, 0, 0, hex"aabbccdd");
        bytes memory data = abi.encodePacked(
            MultiSend.multiSend.selector,
            bytes32(uint256(0x20)),
            bytes32(payload.length + 100), // wrong length
            payload
        );
        uint256 padLen = _ceil32(data.length) - data.length;
        if (padLen > 0) {
            data = abi.encodePacked(data, new bytes(padLen));
        }

        vm.expectRevert(MultiSendUnwrapper.MalformedHeader.selector);
        unwrapper.unwrap(address(0), 0, data, Operation.DelegateCall);
    }

    function test_revertsValueNotZero() public {
        bytes memory payload = _encodeSingleTx(targetA, 0, 0, hex"aabbccdd");
        bytes memory data = _encodeMultiSend(payload);

        vm.expectRevert(MultiSendUnwrapper.UnsupportedMode.selector);
        unwrapper.unwrap(address(0), 1 ether, data, Operation.DelegateCall);
    }

    function test_revertsNotDelegateCall() public {
        bytes memory payload = _encodeSingleTx(targetA, 0, 0, hex"aabbccdd");
        bytes memory data = _encodeMultiSend(payload);

        vm.expectRevert(MultiSendUnwrapper.UnsupportedMode.selector);
        unwrapper.unwrap(address(0), 0, data, Operation.Call);
    }

    function test_revertsNoTransactionEncoded() public {
        // Empty payload (no transactions)
        bytes memory data = _encodeMultiSend(hex"");

        vm.expectRevert(MultiSendUnwrapper.MalformedBody.selector);
        unwrapper.unwrap(address(0), 0, data, Operation.DelegateCall);
    }

    // =========================================================================
    // Success Cases
    // =========================================================================

    function test_unwrapsSingleTransaction() public {
        bytes memory innerData = hex"aabbccdd";
        bytes memory payload = _encodeSingleTx(targetA, 0, 0, innerData);
        bytes memory data = _encodeMultiSend(payload);

        UnwrappedTransaction[] memory txs = unwrapper.unwrap(
            address(0), 0, data, Operation.DelegateCall
        );

        assertEq(txs.length, 1);
        assertEq(txs[0].to, targetA);
        assertEq(txs[0].value, 0);
        assertEq(uint8(txs[0].operation), uint8(Operation.Call));
        assertEq(txs[0].dataSize, innerData.length);
    }

    function test_unwrapsMultipleTransactions() public {
        bytes memory innerData1 = hex"aabbccdd";
        bytes memory innerData2 = hex"11223344";

        bytes memory payload = abi.encodePacked(
            _encodeSingleTx(targetA, 0, 0, innerData1),
            _encodeSingleTx(targetB, 0, 0, innerData2)
        );
        bytes memory data = _encodeMultiSend(payload);

        UnwrappedTransaction[] memory txs = unwrapper.unwrap(
            address(0), 0, data, Operation.DelegateCall
        );

        assertEq(txs.length, 2);

        assertEq(txs[0].to, targetA);
        assertEq(txs[0].value, 0);
        assertEq(txs[0].dataSize, innerData1.length);

        assertEq(txs[1].to, targetB);
        assertEq(txs[1].value, 0);
        assertEq(txs[1].dataSize, innerData2.length);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    function _encodeSingleTx(
        address to,
        uint256 value,
        uint8 operation,
        bytes memory data
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            operation,
            to,
            value,
            data.length,
            data
        );
    }

    function _encodeMultiSend(bytes memory payload) internal pure returns (bytes memory) {
        bytes memory data = abi.encodePacked(
            MultiSend.multiSend.selector,
            bytes32(uint256(0x20)),
            bytes32(payload.length),
            payload
        );
        // Pad to 32-byte boundary (4 bytes selector + 32 offset + 32 length + payload)
        uint256 contentLen = 32 + 32 + payload.length;
        uint256 padded = _ceil32(contentLen);
        uint256 padLen = padded - contentLen;
        if (padLen > 0) {
            data = abi.encodePacked(data, new bytes(padLen));
        }
        return data;
    }

    function _ceil32(uint256 length) internal pure returns (uint256) {
        return ((length + 32 - 1) / 32) * 32;
    }
}
