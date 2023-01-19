// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ScopeConfig.sol";
import "./Types.sol";

library ParameterLayout {
    error MalformedFlatParameter(uint256 index);

    //

    function flatToTree(
        ParameterConfigFlat[] memory configs
    ) internal pure returns (ParameterConfig[] memory result) {
        result = new ParameterConfig[](_countRootNodes(configs));
        uint256 length = result.length;
        for (uint256 i; i < length; ++i) {
            result[i] = pull(configs, i);
        }
    }

    function pull(
        ParameterConfigFlat[] memory configs,
        uint256 j
    ) internal pure returns (ParameterConfig memory result) {
        result.isScoped = configs[j].isScoped;
        result._type = configs[j]._type;
        result.comp = configs[j].comp;
        if (result.isScoped) {
            if (
                result._type == ParameterType.Tuple ||
                result._type == ParameterType.Array
            ) {
                result.children = pullChildren(configs, j);
            } else {
                result.compValues = _compress(configs[j]);
            }
        }

        return result;
    }

    function pullChildren(
        ParameterConfigFlat[] memory configs,
        uint256 j
    ) internal pure returns (ParameterConfig[] memory result) {
        uint256 count = _countChildren(configs, j);
        if (count > 0) {
            result = new ParameterConfig[](count);
            uint256 insert;
            for (uint256 i = j + 1; insert < count; i++) {
                if (configs[i].parent == j) {
                    result[insert++] = pull(configs, i);
                }
            }
        }
    }

    function _countRootNodes(
        ParameterConfigFlat[] memory configs
    ) private pure returns (uint256 count) {
        uint256 length = configs.length;
        for (uint256 i; i < length; ++i) {
            if (configs[i].parent == i) {
                count++;
            }
        }
    }

    function _countChildren(
        ParameterConfigFlat[] memory parameters,
        uint256 i
    ) private pure returns (uint256 count) {
        uint256 length = parameters.length;
        for (uint256 j = i + 1; j < length; ++j) {
            if (parameters[j].parent == i) {
                count++;
            }
        }
    }

    function _compress(
        ParameterConfigFlat memory config
    ) private pure returns (bytes32[] memory) {
        if (config.comp == Comparison.SubsetOf) {
            assert(config.compValues.length == 1);
            return _splitCompValue(config._type, config.compValues[0]);
        } else {
            return _compressCompValues(config._type, config.compValues);
        }
    }

    function _compressCompValues(
        ParameterType paramType,
        bytes[] memory compValues
    ) private pure returns (bytes32[] memory result) {
        result = new bytes32[](compValues.length);
        for (uint256 i; i < compValues.length; ++i) {
            result[i] = paramType == ParameterType.Static
                ? bytes32(compValues[i])
                : keccak256(compValues[i]);
        }
    }

    function _splitCompValue(
        ParameterType paramType,
        bytes memory compValue
    ) private pure returns (bytes32[] memory) {
        assert(paramType == ParameterType.Dynamic32);

        uint256 length = compValue.length / 32;
        bytes32[] memory result = new bytes32[](length);

        uint256 offset = 32;
        for (uint256 i; i < length; ++i) {
            bytes32 chunk;
            assembly {
                chunk := mload(add(compValue, offset))
            }
            result[i] = chunk;
            offset += 32;
        }

        return result;
    }
}
