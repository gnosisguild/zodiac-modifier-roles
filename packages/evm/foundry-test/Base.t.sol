// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

interface Vm {
    struct Log {
        bytes32[] topics;
        bytes data;
        address emitter;
    }

    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata data) external;
    function prank(address sender) external;
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
}

abstract contract BaseTest {
    Vm internal constant vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(uint256 actual, uint256 expected, string memory message)
        internal
        pure
    {
        require(actual == expected, message);
    }

    function assertEq(address actual, address expected, string memory message)
        internal
        pure
    {
        require(actual == expected, message);
    }

    function assertEq(bytes32 actual, bytes32 expected, string memory message)
        internal
        pure
    {
        require(actual == expected, message);
    }

    function assertTrue(bool value, string memory message) internal pure {
        require(value, message);
    }
}
