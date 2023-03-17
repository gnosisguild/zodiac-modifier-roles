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
        ConditionFlat[] memory parameters,
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
    ) internal view override returns (Condition memory result) {
        bytes32 value = role.scopeConfig[key];

        (uint256 length, , , address pointer) = ScopeConfig.unpackHeader(value);
        bytes memory buffer = WriteOnce.load(pointer);
        result = _unpack(buffer, length);
        _loadAllowances(result);
    }

    function _pack(
        ConditionFlat[] memory parameters
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
    ) private pure returns (Condition memory result) {
        (
            uint8[] memory parents,
            ScopeConfig.Packing[] memory modes
        ) = ScopeConfig.unpackModes(buffer, count);

        _unpackCondition(
            buffer,
            0,
            Topology.childrenBounds(parents),
            modes,
            result
        );
    }

    function _unpackCondition(
        bytes memory buffer,
        uint256 index,
        Bounds[] memory childrenBounds,
        ScopeConfig.Packing[] memory modes,
        Condition memory result
    ) private pure {
        ScopeConfig.unpackCondition(buffer, index, modes, result);
        uint256 left = childrenBounds[index].left;
        uint256 right = childrenBounds[index].right;
        if (right < left) {
            return;
        }

        uint256 childrenCount = right - left + 1;
        result.children = new Condition[](childrenCount);
        for (uint j; j < childrenCount; ) {
            _unpackCondition(
                buffer,
                left + j,
                childrenBounds,
                modes,
                result.children[j]
            );

            unchecked {
                ++j;
            }
        }
    }

    function _loadAllowances(Condition memory result) private view {
        if (
            result.operator == Operator.WithinAllowance ||
            result.operator == Operator.ETHWithinAllowance
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
