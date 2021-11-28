// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract TestContract {
    event Receive();
    event Mint(address to, uint256 amount);
    event TestDynamic(string test, uint256 test2, string test3, bool test4, uint8 test5, string test6);

    receive() external payable {
        emit Receive();
    }

    function mint(address to, uint256 amount) public returns (uint256) {
        emit Mint(to, amount);
        return amount;
    }

    function testDynamic(string memory test, uint256 test2, string memory test3, bool test4, uint8 test5, string memory test6) public returns (bool) {
    	emit TestDynamic(test, test2, test3, test4, test5, test6);
    	return true;
    }
}
