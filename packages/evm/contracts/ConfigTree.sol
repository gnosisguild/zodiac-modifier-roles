// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./ScopeConfig.sol";
import "./Types.sol";

struct ParameterConfig2 {
    uint8[] path;
    ParameterType _type;
    Comparison comp;
    bytes[] compValues;
}

struct ParameterConfigTree {
    bool isScoped;
    ParameterType _type;
    Comparison comp;
    bytes[] compValues;
    ParameterConfigTree[] children;
}

library ConfigTree {
    function create(
        ParameterConfig2[] memory parameters
    ) internal pure returns (ParameterConfigTree[] memory) {
        ParameterConfigTree memory tree;
        tree.children = new ParameterConfigTree[](_countTopNodes(parameters));

        for (uint256 i; i < parameters.length; i++) {
            ParameterConfig2 memory parameter = parameters[i];
            ParameterConfigTree memory node = _select(tree, parameter.path);
            uint256 count = _countChildren(parameter.path, parameters);
            if (count > 0) {
                node.children = new ParameterConfigTree[](count);
            }
            node.isScoped = true;
            node._type = parameter._type;
            node.comp = parameter.comp;
            node.compValues = parameter.compValues;
        }

        return tree.children;
    }

    function _select(
        ParameterConfigTree memory tree,
        uint8[] memory path
    ) private pure returns (ParameterConfigTree memory) {
        for (uint256 i = 0; i < path.length; ++i) {
            tree = tree.children[path[i]];
        }
        return tree;
    }

    function _copy(
        ParameterConfigTree memory node,
        ParameterConfig2 memory parameter
    ) private pure {
        node.isScoped = true;
        node._type = parameter._type;
        node.comp = parameter.comp;
        node.compValues = parameter.compValues;
    }

    function _countTopNodes(
        ParameterConfig2[] memory parameters
    ) private pure returns (uint256 count) {
        for (uint256 i; i < parameters.length; i++) {
            uint8[] memory childPath = parameters[i].path;
            if (childPath.length == 1) {
                uint256 childIndex = childPath[0];
                count = count > (childIndex + 1) ? count : (childIndex + 1);
            }
        }
    }

    function _countChildren(
        uint8[] memory path,
        ParameterConfig2[] memory parameters
    ) private pure returns (uint256 count) {
        for (uint256 i; i < parameters.length; i++) {
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
}
