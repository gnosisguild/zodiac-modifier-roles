// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

import "./Core.sol";
import "./Topology.sol";

import "./bitmaps/ScopeConfig.sol";
import "./bitmaps/CompValues.sol";

abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    ) internal override {
        (
            BitmapBuffer memory scopeConfig,
            BitmapBuffer memory compValues
        ) = _packParameters(parameters, options);

        _storeBitmap(role.scopeConfig, key, scopeConfig);
        _storeBitmap(role.compValues, key, compValues);
    }

    function _load(
        Role storage role,
        bytes32 key
    ) internal view override returns (ParameterConfig[] memory result) {
        BitmapBuffer memory scopeConfig = _loadBitmap(role.scopeConfig, key);
        BitmapBuffer memory compValues = _loadBitmap(role.compValues, key);
        result = _unpackParameters(scopeConfig, compValues);
        _loadAllowances(result);
    }

    function _loadAllowances(ParameterConfig[] memory result) private view {
        uint256 length = result.length;
        for (uint256 i; i < length; ++i) {
            if (result[i].comp == Comparison.WithinLimit) {
                uint16 allowanceId = uint16(uint256(result[i].compValue));
                (result[i].allowance, ) = accruedBalance(
                    allowances[allowanceId],
                    block.timestamp
                );
            }

            if (result[i].children.length > 0) {
                _loadAllowances(result[i].children);
            }
        }
    }

    function _packParameters(
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    )
        private
        pure
        returns (
            BitmapBuffer memory scopeConfig,
            BitmapBuffer memory compValues
        )
    {
        uint256 length = parameters.length;
        scopeConfig = ScopeConfig.create(length, false, options);
        compValues = CompValues.create(length);

        Compression.Mode compression;
        uint256 offset = 5;
        for (uint8 i; i < length; ++i) {
            ParameterConfigFlat calldata parameter = parameters[i];
            (compression, offset) = CompValues.pack(
                compValues,
                parameter,
                offset
            );
            ScopeConfig.packParameter(scopeConfig, parameter, compression, i);
        }
    }

    function _unpackParameters(
        BitmapBuffer memory scopeConfigBuffer,
        BitmapBuffer memory compValuesBuffer
    ) internal pure returns (ParameterConfig[] memory result) {
        (
            uint8[] memory parents,
            Compression.Mode[] memory compressions
        ) = ScopeConfig.unpackMisc(scopeConfigBuffer);

        (
            bytes32[] memory compValues,
            bool[] memory isHashed
        ) = _unpackCompValues(compValuesBuffer, compressions);

        (uint256 left, uint256 right) = Topology.rootBounds(parents);
        result = new ParameterConfig[](right - left + 1);
        for (uint256 i = left; i <= right; ++i) {
            result[i] = _unpackParameter(
                scopeConfigBuffer,
                compValues,
                parents,
                isHashed,
                i
            );
        }
    }

    function _unpackParameter(
        BitmapBuffer memory scopeConfig,
        bytes32[] memory compValues,
        uint8[] memory parents,
        bool[] memory isHashed,
        uint256 index
    ) private pure returns (ParameterConfig memory result) {
        result = ScopeConfig.unpackParameter(scopeConfig, index);
        result.isHashed = isHashed[index];
        result.compValue = compValues[index];

        (uint256 left, uint256 right) = Topology.childrenBounds(parents, index);
        if (left <= right) {
            result.children = new ParameterConfig[](right - left + 1);
            for (uint256 j = left; j <= right; j++) {
                result.children[j - left] = _unpackParameter(
                    scopeConfig,
                    compValues,
                    parents,
                    isHashed,
                    j
                );
            }
        }
    }

    function _unpackCompValues(
        BitmapBuffer memory buffer,
        Compression.Mode[] memory compressions
    )
        private
        pure
        returns (bytes32[] memory compValues, bool[] memory isHashed)
    {
        uint256 length = compressions.length;
        compValues = new bytes32[](length);
        isHashed = new bool[](length);

        uint256 offset = 5;
        for (uint256 i; i < length; ++i) {
            Compression.Mode compression = compressions[i];
            if (compression == Compression.Mode.Empty) {
                continue;
            }

            (compValues[i], isHashed[i], offset) = CompValues.unpack(
                buffer,
                offset,
                compression
            );
        }
    }

    function _storeBitmap(
        mapping(bytes32 => bytes32) storage bitmap,
        bytes32 key,
        BitmapBuffer memory value
    ) private {
        bytes32 header = value.payload[0];
        uint256 pages = uint256(header) >> 251;

        bitmap[key] = header;
        for (uint256 i = 1; i < pages; ++i) {
            bitmap[_key(key, i)] = value.payload[i];
        }
    }

    function _loadBitmap(
        mapping(bytes32 => bytes32) storage bitmap,
        bytes32 key
    ) private view returns (BitmapBuffer memory result) {
        bytes32 header = bitmap[key];
        uint256 pages = uint256(header) >> 251;

        result.payload = new bytes32[](pages > 0 ? pages : 1);
        result.payload[0] = header;
        for (uint256 i = 1; i < pages; ++i) {
            result.payload[i] = bitmap[_key(key, i)];
        }
    }
}
