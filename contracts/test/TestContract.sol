// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract TestContract {
    event Receive();
    event Mint(address to, uint256 amount);
    event TestDynamic(
        string test,
        uint256 test2,
        string test3,
        bool test4,
        uint8 test5,
        string test6,
        string test7
    );
    event DoNothing();
    event DoEvenLess();
    event FnWithSingleParam(uint256);
    event FnWithTwoParams(uint256, uint256);
    event FnWithThreeParams(uint256, uint256, uint256);

    receive() external payable {
        emit Receive();
    }

    function mint(address to, uint256 amount) public returns (uint256) {
        emit Mint(to, amount);
        return amount;
    }

    function testDynamic(
        string memory test,
        uint256 test2,
        string memory test3,
        bool test4,
        uint8 test5,
        string memory test6,
        string memory test7
    ) public returns (bool) {
        emit TestDynamic(test, test2, test3, test4, test5, test6, test7);
        return true;
    }

    function doNothing() public {
        emit DoNothing();
    }

    function doEvenLess() public {
        emit DoEvenLess();
    }

    function fnWithSingleParam(uint256 p) public {
        emit FnWithSingleParam(p);
    }

    function fnWithTwoParams(uint256 a, uint256 b) public {
        emit FnWithTwoParams(a, b);
    }

    function fnWithThreeParams(
        uint256 a,
        uint256 b,
        uint256 c
    ) public {
        emit FnWithThreeParams(a, b, c);
    }
}
