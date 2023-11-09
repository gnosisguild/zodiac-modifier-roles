// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract TestContract {
    event Receive();
    event ReceiveFallback(uint256 amount);
    event ReceiveEthAndDoNothing(uint256 amount);
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
    event FnWithTwoMixedParams(bool, string);
    event EmitTheSender(address);
    event DynamicDynamic32(string, bytes2[]);

    event Dynamic(bytes);
    event Dynamic32(bytes4[]);

    error AnError();

    receive() external payable {
        emit Receive();
        emit ReceiveFallback(msg.value);
    }

    function receiveEthAndDoNothing() public payable {
        emit ReceiveEthAndDoNothing(msg.value);
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

    uint16 public aStorageNumber;

    function setAStorageNumber(uint16 value) public {
        aStorageNumber = value;
    }

    function fnWithSingleParam(uint256 p) public payable {
        emit FnWithSingleParam(p);
    }

    function fnWithTwoParams(uint256 a, uint256 b) public {
        emit FnWithTwoParams(a, b);
    }

    function fnWithTwoMixedParams(bool a, string calldata s) public {
        emit FnWithTwoMixedParams(a, s);
    }

    function fnWithThreeParams(uint256 a, uint256 b, uint256 c) public {
        emit FnWithThreeParams(a, b, c);
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

    function emitTheSender() public {
        emit EmitTheSender(msg.sender);
    }

    function dynamicDynamic32(
        string calldata first,
        bytes2[] calldata second
    ) public {
        emit DynamicDynamic32(first, second);
    }

    function dynamic(bytes calldata first) public {
        emit Dynamic(first);
    }

    function dynamic32(bytes4[] calldata first) public {
        emit Dynamic32(first);
    }

    function dynamicString(string memory) public {}

    function oneParamStatic(uint256) public payable {}

    function oneParamUintWord(uint256) public {}

    function oneParamUintSmall(uint8) public {}

    function oneParamIntWord(int256) public {}

    function oneParamIntSmall(int8) public {}

    function oneParamBytesWord(bytes32) public {}

    function oneParamBytesSmall(bytes1) public {}

    function oneParamBytes(bytes calldata) public {}

    function oneParamString(string calldata) public {}

    function oneParamAddress(address) public {}

    struct StaticTuple {
        uint256 a;
        bool b;
    }

    struct StaticNestedTuple {
        uint256 a;
        StaticTuple b;
    }

    function oneParamStaticTuple(StaticTuple calldata) public {}

    function oneParamStaticNestedTuple(StaticNestedTuple calldata) public {}

    struct DynamicTuple {
        uint256 a;
        bytes b;
    }

    struct DynamicNestedTuple {
        uint256 a;
        DynamicTuple b;
    }

    function oneParamDynamicTuple(DynamicTuple calldata) public {}

    function oneParamDynamicNestedTuple(DynamicNestedTuple calldata) public {}

    function oneParamArrayOfStatic(uint256[] calldata) public {}

    function oneParamArrayOfStaticTuple(StaticTuple[] calldata) public {}

    function oneParamArrayOfDynamicTuple(DynamicTuple[] calldata) public {}

    function twoParamsStatic(uint256 a, uint256 b) public {}

    function twoParamsStaticTupleStatic(StaticTuple calldata, uint256) public {}

    function spendAndMaybeRevert(uint256, bool revert_) public pure {
        if (revert_) {
            revert();
        }
    }
}
