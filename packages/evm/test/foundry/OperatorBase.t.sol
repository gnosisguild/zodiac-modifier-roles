// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "./Base.t.sol";

abstract contract OneParamSetup is BaseTest {
    bytes4 internal fnSelector = bytes4(keccak256("fn(uint256)"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(uint256 a) internal {
        _exec(address(testContract), 0, abi.encodeWithSelector(fnSelector, a));
    }

    function _invoke(uint256 a, uint256 value) internal {
        _exec(
            address(testContract),
            value,
            abi.encodeWithSelector(fnSelector, a)
        );
    }

    function _invoke(uint256 a, uint256 value, Operation op) internal {
        _exec(
            address(testContract),
            value,
            abi.encodeWithSelector(fnSelector, a),
            op
        );
    }
}

abstract contract OneParamSignedSetup is BaseTest {
    bytes4 internal fnSelector = bytes4(keccak256("fn(int256)"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(int256 a) internal {
        _exec(address(testContract), 0, abi.encodeWithSelector(fnSelector, a));
    }

    function _invoke(int256 a, uint256 value) internal {
        _exec(
            address(testContract),
            value,
            abi.encodeWithSelector(fnSelector, a)
        );
    }

    function _invoke(int256 a, uint256 value, Operation op) internal {
        _exec(
            address(testContract),
            value,
            abi.encodeWithSelector(fnSelector, a),
            op
        );
    }
}

abstract contract TwoParamSetup is BaseTest {
    bytes4 internal fnSelector = bytes4(keccak256("fn(uint256,uint256)"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(uint256 a, uint256 b) internal {
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, a, b)
        );
    }

    function _invoke(uint256 a, uint256 b, uint256 value) internal {
        _exec(
            address(testContract),
            value,
            abi.encodeWithSelector(fnSelector, a, b)
        );
    }
}

abstract contract DynamicParamSetup is BaseTest {
    bytes4 internal fnSelector = bytes4(keccak256("fn(bytes)"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(bytes memory data) internal {
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, data)
        );
    }

    function _invoke(bytes memory data, uint256 value) internal {
        _exec(
            address(testContract),
            value,
            abi.encodeWithSelector(fnSelector, data)
        );
    }
}

abstract contract ArrayParamSetup is BaseTest {
    bytes4 internal fnSelector = bytes4(keccak256("fn(uint256[])"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(uint256[] memory arr) internal {
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, arr)
        );
    }

    function _invoke(uint256[] memory arr, uint256 value) internal {
        _exec(
            address(testContract),
            value,
            abi.encodeWithSelector(fnSelector, arr)
        );
    }
}

abstract contract TwoArrayParamSetup is BaseTest {
    bytes4 internal fnSelector =
        bytes4(keccak256("fn(uint256[],uint256[])"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(uint256[] memory a, uint256[] memory b) internal {
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, a, b)
        );
    }
}

abstract contract ThreeArrayParamSetup is BaseTest {
    bytes4 internal fnSelector =
        bytes4(keccak256("fn(uint256[],uint256[],uint256[])"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(
        uint256[] memory a,
        uint256[] memory b,
        uint256[] memory c
    ) internal {
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, a, b, c)
        );
    }
}

abstract contract TwoTupleArrayParamSetup is BaseTest {
    struct Pair {
        uint256 a;
        uint256 b;
    }

    bytes4 internal fnSelector =
        bytes4(keccak256("fn((uint256,uint256)[],(uint256,uint256)[])"));

    function _allowFunction(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal {
        vm.prank(owner);
        roles.allowFunction(
            roleKey,
            address(testContract),
            fnSelector,
            _pack(conditions),
            options
        );
    }

    function _allowFunction(ConditionFlat[] memory conditions) internal {
        _allowFunction(conditions, ExecutionOptions.None);
    }

    function _invoke(Pair[] memory a, Pair[] memory b) internal {
        _exec(
            address(testContract),
            0,
            abi.encodeWithSelector(fnSelector, a, b)
        );
    }
}
