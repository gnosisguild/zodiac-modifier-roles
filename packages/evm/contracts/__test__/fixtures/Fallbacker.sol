// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract Fallbacker {
    event Selector(bytes4 selector);

    fallback() external payable {
        emit Selector(bytes4(msg.data));
    }

    receive() external payable {
        emit Selector(bytes4(0));
    }
}
