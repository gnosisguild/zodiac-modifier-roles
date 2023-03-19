// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

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
    }

    function _pack(
        ParameterConfigFlat[] memory parameters
    ) private pure returns (bytes memory buffer) {
        buffer = new bytes(ScopeConfig.packedSize(parameters));

        uint256 paramCount = parameters.length;
        uint256 offset = 32 + paramCount * 2;
        for (uint256 i; i < paramCount; ) {
            ScopeConfig.packParameter(buffer, i, parameters[i]);
            if (parameters[i].comp >= Comparison.EqualTo) {
                ScopeConfig.packCompValue(buffer, offset, parameters[i]);
                offset += 32;
            }

            unchecked {
                ++i;
            }
        }
    }

    function _unpack(
        bytes memory buffer,
        uint256 paramCount
    ) private pure returns (ParameterConfig memory result) {
        (
            ParameterConfigFlat[] memory parameters,
            bytes32[] memory compValues
        ) = ScopeConfig.unpackParameters(buffer, paramCount);

        _unpack(
            parameters,
            compValues,
            Topology.childrenBounds(parameters),
            0,
            result
        );
    }

    function _unpack(
        ParameterConfigFlat[] memory parameters,
        bytes32[] memory compValues,
        Topology.Bounds[] memory childrenBounds,
        uint256 index,
        ParameterConfig memory result
    ) private pure {
        ParameterConfigFlat memory parameter = parameters[index];
        result._type = parameter._type;
        result.comp = parameter.comp;
        result.compValue = compValues[index];
        // result.isHashed = parameter.comp == Comparison.EqualTo;

        if (childrenBounds[index].length == 0) {
            return;
        }

        uint256 start = childrenBounds[index].start;
        uint256 count = childrenBounds[index].length;

        result.children = new ParameterConfig[](count);
        for (uint j; j < count; ) {
            _unpack(
                parameters,
                compValues,
                childrenBounds,
                start + j,
                result.children[j]
            );

            unchecked {
                ++j;
            }
        }
    }
}
