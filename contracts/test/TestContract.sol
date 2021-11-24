// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract TestContract {
    event Receive();
    event Mint(address to, uint256 amount);
    event TestDynamic(string test);

    receive() external payable {
        emit Receive();
    }

    function mint(address to, uint256 amount) public returns (uint256) {
        emit Mint(to, amount);
        return amount;
    }

    function testDynamic(string memory test) public returns (bool) {
    	emit TestDynamic(test);
    	return true;
    }
}
