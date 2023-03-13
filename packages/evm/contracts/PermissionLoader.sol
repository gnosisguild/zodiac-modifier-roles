// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./WriteOnce.sol";

import "./Core.sol";
import "./Topology.sol";
import "./ScopeConfig.sol";

abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    ) internal override {
        bytes memory buffer = _pack(parameters);
        address pointer = WriteOnce.store(buffer);

        bytes32 value = ScopeConfig.packHeader(
            parameters.length,
            false,
            options,
            pointer
        );

        role.scopeConfig[key] = value;
    }

    function _load(
        Role storage role,
        bytes32 key
    ) internal view override returns (ParameterConfig memory result) {
        bytes32 value = role.scopeConfig[key];

        (uint256 length, , , address pointer) = ScopeConfig.unpackHeader(value);
        bytes memory buffer = WriteOnce.load(pointer);
        result = _unpack(buffer, length);
        _loadAllowances(result);
    }

    function _pack(
        ParameterConfigFlat[] calldata parameters
    ) private pure returns (bytes memory buffer) {
        ScopeConfig.Packing[] memory modes = ScopeConfig.packModes(parameters);
        buffer = new bytes(ScopeConfig.bufferSize(modes));

        uint256 count = parameters.length;
        for (uint256 i; i < count; ++i) {
            ScopeConfig.packParameter(buffer, i, modes, parameters[i]);
        }
    }

    function _unpack(
        bytes memory buffer,
        uint256 count
    ) private pure returns (ParameterConfig memory result) {
        (
            uint8[] memory parents,
            ScopeConfig.Packing[] memory modes
        ) = ScopeConfig.unpackModes(buffer, count);

        _unpackParameter(buffer, 0, _childrenBounds(parents), modes, result);
    }

    function _unpackParameter(
        bytes memory buffer,
        uint256 index,
        Bounds[] memory childrenBounds,
        ScopeConfig.Packing[] memory modes,
        ParameterConfig memory result
    ) private pure {
        ScopeConfig.unpackParameter(buffer, index, modes, result);
        uint256 left = childrenBounds[index].left;
        uint256 right = childrenBounds[index].right;
        if (right < left) {
            return;
        }

        uint256 childrenCount = right - left + 1;
        result.children = new ParameterConfig[](childrenCount);
        for (uint j = 0; j < childrenCount; ++j) {
            _unpackParameter(
                buffer,
                left + j,
                childrenBounds,
                modes,
                result.children[j]
            );
        }
    }

    function _loadAllowances(ParameterConfig memory result) private view {
        if (result.comp == Comparison.WithinAllowance) {
            uint16 allowanceId = uint16(uint256(result.compValue));
            (result.allowance, ) = accruedAllowance(
                allowances[allowanceId],
                block.timestamp
            );
        }

        uint256 length = result.children.length;
        for (uint256 i; i < length; ++i) {
            _loadAllowances(result.children[i]);
        }
    }

    function _childrenBounds(
        uint8[] memory parents
    ) private pure returns (Bounds[] memory result) {
        uint256 count = parents.length;
        result = new Bounds[](parents.length);

        // parents are DFS
        for (uint256 i = 0; i < count; ++i) {
            result[i].left = type(uint256).max;
        }

        // 0 is the root
        for (uint256 i = 1; i < count; ++i) {
            Bounds memory bounds = result[parents[i]];
            if (bounds.left == type(uint256).max) {
                bounds.left = i;
            }
            bounds.right = i;
        }
    }

    struct Bounds {
        uint256 left;
        uint256 right;
    }
}
