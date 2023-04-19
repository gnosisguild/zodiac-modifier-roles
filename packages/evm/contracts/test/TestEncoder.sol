// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

contract TestEncoder {
    function simple(uint256) external {}

    function staticFn(bytes4) external {}

    function staticDynamic(uint256, bytes memory) external {}

    function dynamic(bytes memory) external {}

    function dynamicArray(bytes[] memory) external {}

    function staticDynamicDynamic32(
        address,
        bytes calldata,
        uint32[] memory
    ) external {}

    function dynamicStaticDynamic32(
        bytes calldata,
        bool,
        bytes2[] memory
    ) external {}

    function dynamic32DynamicStatic(
        bytes2[] calldata,
        string memory,
        uint32
    ) external {}

    struct DynamicTuple {
        bytes dynamic;
        uint256 _static;
        uint256[] dynamic32;
    }

    function dynamicTuple(DynamicTuple memory) external {}

    struct MultiDynamicTuple {
        bytes a;
        uint256 b;
        bytes c;
        uint256[] d;
    }

    function multiDynamicTuple(MultiDynamicTuple memory) external {}

    struct _DynamicTuple {
        bytes dynamic;
    }

    function _dynamicTuple(_DynamicTuple memory) external {}

    struct StaticTuple {
        uint256 a;
        address b;
    }

    function staticTuple(StaticTuple memory, uint256) external {}

    struct DynamicTupleWithStaticTuple {
        uint256 a;
        bytes b;
        StaticTuple c;
    }

    function dynamicTupleWithNestedStaticTuple(
        DynamicTupleWithStaticTuple memory
    ) external {}

    struct DynamicTupleWithDynamicTuple {
        bytes a;
        StaticTuple b;
        uint256 c;
        DynamicTuple d;
    }

    function dynamicTupleWithNestedDynamicTuple(
        DynamicTupleWithDynamicTuple memory
    ) external {}

    struct DynamicTupleWithArray {
        uint256 a;
        bytes b;
        StaticTuple[] c;
    }

    function dynamicTupleWithNestedArray(
        DynamicTupleWithArray memory
    ) external {}

    function arrayStaticTupleItems(StaticTuple[] memory) external {}

    function arrayDynamicTupleItems(DynamicTuple[] memory) external {}
}
