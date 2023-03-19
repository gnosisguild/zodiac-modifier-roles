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
        ParameterConfigFlat[] memory parameters,
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
        ParameterConfigFlat[] memory parameters
    ) private pure returns (bytes memory buffer) {
        ScopeConfig.Packing[] memory modes = ScopeConfig.calculateModes(
            parameters
        );
        buffer = new bytes(ScopeConfig.bufferSize(modes));

        uint256 count = parameters.length;
        for (uint256 i; i < count; ) {
            ScopeConfig.packParameter(buffer, i, modes, parameters[i]);

            unchecked {
                ++i;
            }
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

        _unpackParameter(
            buffer,
            0,
            Topology.childrenBounds(parents),
            modes,
            result
        );
    }

    function _unpackParameter(
        bytes memory buffer,
        uint256 index,
        Topology.Bounds[] memory childrenBounds,
        ScopeConfig.Packing[] memory modes,
        ParameterConfig memory result
    ) private pure {
        ScopeConfig.unpackParameter(buffer, index, modes, result);
        if (childrenBounds[index].length == 0) {
            return;
        }

        uint256 start = childrenBounds[index].start;
        uint256 count = childrenBounds[index].length;

        result.children = new ParameterConfig[](count);
        for (uint j; j < count; ) {
            _unpackParameter(
                buffer,
                start + j,
                childrenBounds,
                modes,
                result.children[j]
            );

            unchecked {
                ++j;
            }
        }
    }

    function _loadAllowances(ParameterConfig memory result) private view {
        if (
            result.comp == Comparison.WithinAllowance ||
            result.comp == Comparison.ETHWithinAllowance ||
            result.comp == Comparison.CallWithinAllowance
        ) {
            uint16 allowanceId = uint16(uint256(result.compValue));
            (result.allowance, ) = _accruedAllowance(
                allowances[allowanceId],
                block.timestamp
            );
        }

        uint256 length = result.children.length;
        for (uint256 i; i < length; ) {
            _loadAllowances(result.children[i]);
            unchecked {
                ++i;
            }
        }
    }
}
