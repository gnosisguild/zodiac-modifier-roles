// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./write-once/SSTORE2.sol";

import "./Core.sol";
import "./Topology.sol";

import "./bitmaps/ScopeConfig.sol";

abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    ) internal override {
        bytes memory buffer = _packBuffer(parameters);
        address pointer = SSTORE2.write(buffer);

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
        bytes memory buffer = SSTORE2.read(pointer);
        result = _unpackBuffer(buffer, length);
        _loadAllowances(result);
    }

    function _packBuffer(
        ParameterConfigFlat[] calldata parameters
    ) private view returns (bytes memory buffer) {
        buffer = new bytes(ScopeConfig.bufferSize(parameters));

        uint256 count = parameters.length;
        uint256 offset = count * 2;
        for (uint8 i; i < count; ++i) {
            ParameterConfigFlat calldata parameter = parameters[i];
            ScopeConfig.Packing mode = ScopeConfig.packMode(
                parameter.comp,
                parameter.compValue
            );

            ScopeConfig.packParameter(
                buffer,
                i,
                parameter,
                mode == ScopeConfig.Packing.Hash
            );
        }
        ScopeConfig.packCompValues(buffer, parameters);
    }

    function _unpackBuffer(
        bytes memory buffer,
        uint256 count
    ) private pure returns (ParameterConfig memory result) {
        (
            uint8[] memory parents,
            ScopeConfig.Packing[] memory modes
        ) = ScopeConfig.unpackMisc(buffer, count);

        bytes32[] memory compValues = ScopeConfig.unpackCompValues(
            buffer,
            modes
        );

        result = _unpackParameter(buffer, 0, compValues, parents);
    }

    function _unpackParameter(
        bytes memory buffer,
        uint256 index,
        bytes32[] memory compValues,
        uint8[] memory parents
    ) private pure returns (ParameterConfig memory result) {
        result = ScopeConfig.unpackParameter(buffer, index);
        result.compValue = compValues[index];

        (uint256 left, uint256 right) = Topology.childrenBounds(parents, index);
        if (left <= right) {
            result.children = new ParameterConfig[](right - left + 1);
            for (uint256 j = left; j <= right; j++) {
                result.children[j - left] = _unpackParameter(
                    buffer,
                    j,
                    compValues,
                    parents
                );
            }
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
}
