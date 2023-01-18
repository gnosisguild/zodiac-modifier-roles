// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ScopeConfig.sol";
import "./Types.sol";

library ParameterLayout {
    function flatToTree(
        ParameterConfigFlat[] memory configs
    ) internal pure returns (ParameterConfig[] memory) {
        ParameterConfig memory tree;
        tree.children = new ParameterConfig[](_countTopNodes(configs));

        // findParent put it there
        // count children, allocate it

        for (uint256 i; i < configs.length; i++) {
            ParameterConfigFlat memory config = configs[i];
            ParameterConfig memory parameter = _select(tree, config.path);
            parameter.isScoped = config.isScoped;
            parameter._type = config._type;
            parameter.comp = config.comp;

            if (config.isScoped) {
                if (
                    config._type != ParameterType.Tuple &&
                    config._type != ParameterType.Array
                ) {
                    parameter.compValues = _compress(config);
                }
                uint256 count = _countChildren(config.path, configs);
                if (count > 0) {
                    parameter.children = new ParameterConfig[](count);
                }
            }
        }
        return tree.children;
    }

    function _select(
        ParameterConfig memory node,
        uint8[] memory path
    ) private pure returns (ParameterConfig memory) {
        for (uint256 i; i < path.length; ++i) {
            node = node.children[path[i]];
        }
        return node;
    }

    function _countTopNodes(
        ParameterConfigFlat[] memory parameters
    ) private pure returns (uint256 count) {
        for (uint256 i; i < parameters.length; ++i) {
            uint8[] memory childPath = parameters[i].path;
            if (childPath.length == 1) {
                uint256 childIndex = childPath[0];
                count = count > (childIndex + 1) ? count : (childIndex + 1);
            }
        }
    }

    function _countChildren(
        uint8[] memory path,
        ParameterConfigFlat[] memory parameters
    ) private pure returns (uint256 count) {
        for (uint256 i; i < parameters.length; ++i) {
            uint8[] memory childPath = parameters[i].path;
            if (_isDirectChild(path, childPath)) {
                uint256 childIndex = childPath[path.length];
                count = count > (childIndex + 1) ? count : (childIndex + 1);
            }
        }
    }

    function _isDirectChild(
        uint8[] memory parent,
        uint8[] memory maybeChild
    ) private pure returns (bool) {
        if (parent.length != maybeChild.length - 1) {
            return false;
        }

        for (uint256 i; i < parent.length; ++i) {
            if (parent[i] != maybeChild[i]) return false;
        }
        return true;
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
