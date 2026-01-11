// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract TestContract {
    event DoNothing();
    event DoEvenLess();

    error AnError();

    receive() external payable {}

    function doNothing() public {
        emit DoNothing();
    }

    function doEvenLess() public {
        emit DoEvenLess();
    }

    function fnThatReverts() public pure {
        revert AnError();
    }

    function fnThatMaybeReverts(
        uint256 a,
        bool maybe
    ) public pure returns (uint256) {
        if (maybe) {
            revert AnError();
        }
        return a;
    }

    function oneParamStatic(uint256) public payable {}

    function twoParamsStatic(uint256 a, uint256 b) public {}

    function spendAndMaybeRevert(uint256, bool revert_) public pure {
        if (revert_) {
            revert();
        }
    }
}
