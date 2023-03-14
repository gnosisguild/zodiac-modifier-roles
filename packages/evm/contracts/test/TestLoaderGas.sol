// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

import "../PermissionLoader.sol";

contract TestLoaderGas is PermissionLoader {
    uint16 public constant roleId = 12345;
    bytes32 public constant key = bytes32(bytes4(0xabcdef00));

    function store(
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    ) public {
        _store(roles[roleId], key, parameters, options);
    }

    function load() public view {
        ParameterConfig memory result = _load(roles[roleId], key);
        assert(result.children.length > 0);
    }

    function storeNaive(
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    ) public {
        Role storage role = roles[roleId];
        role.scopeConfig[key] = bytes32(parameters.length);
        uint8[] memory config = new uint8[](parameters.length);

        for (uint i; i < parameters.length; ++i) {
            ParameterConfigFlat memory parameter = parameters[i];

            if (shouldPack(parameter.comp)) {
                config[i] = 1;
                bytes32 compValue = parameter.compValue.length > 32
                    ? keccak256(parameter.compValue)
                    : bytes32(parameter.compValue);
                role.scopeConfig[_key(key, i)] = compValue;
            }
        }
        role.scopeConfig[key] = bytes32(abi.encodePacked(config));
    }

    function loadNaive() public view {
        bytes32[] memory result = new bytes32[](32);

        Role storage role = roles[roleId];
        bytes32 value = role.scopeConfig[key];

        for (uint256 i; value != 0; ++i) {
            if (value & bytes32(bytes1(0xff)) != 0) {
                result[i] = role.scopeConfig[_key(key, i)];
            }
            value = value >> 8;
        }
    }

    function shouldPack(Comparison comparison) private pure returns (bool) {
        return
            comparison == Comparison.EqualTo ||
            comparison == Comparison.GreaterThan ||
            comparison == Comparison.LessThan ||
            comparison == Comparison.WithinAllowance ||
            comparison == Comparison.Bitmask;
    }

    function _key(bytes32 key, uint256 i) internal pure returns (bytes32) {
        /*
         * Unoptimized version:
         * bytes32(abi.encodePacked(bytes24(key), uint8(i)));
         */
        return bytes32(abi.encodePacked(bytes24(key), uint8(i)));
    }
}
