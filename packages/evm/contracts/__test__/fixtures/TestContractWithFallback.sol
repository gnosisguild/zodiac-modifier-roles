// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract TestContractWithFallback {
    event FallbackCalled(bytes data, uint256 value);

    fallback() external payable {
        emit FallbackCalled(msg.data, msg.value);
    }

    receive() external payable {
        emit FallbackCalled("", msg.value);
    }
}
