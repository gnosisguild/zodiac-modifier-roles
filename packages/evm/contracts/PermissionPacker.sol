// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

import "./Core.sol";
import "./Topology.sol";

import "./bitmaps/ScopeConfig.sol";
import "./bitmaps/CompValues.sol";

abstract contract PermissionPacker is Core {
    function _storeBitmap(
        mapping(bytes32 => bytes32) storage bitmap,
        bytes32 key,
        BitmapBuffer memory value
    ) internal override {
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
    ) internal view override returns (BitmapBuffer memory result) {
        bytes32 header = bitmap[key];
        uint256 pages = uint256(header) >> 251;

        result.payload = new bytes32[](pages);
        result.payload[0] = header;
        for (uint256 i = 1; i < pages; ++i) {
            result.payload[i] = bitmap[_key(key, i)];
        }
    }

    function _pack(
        ParameterConfigFlat[] calldata parameters,
        ExecutionOptions options
    )
        internal
        pure
        override
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

    function _unpack(
        BitmapBuffer memory scopeConfig,
        BitmapBuffer memory compValues
    ) internal pure override returns (ParameterConfig[] memory result) {
        (
            uint8[] memory parents,
            Compression.Mode[] memory compressions
        ) = ScopeConfig.unpackMisc(scopeConfig);

        (uint256 left, uint256 right) = Topology.rootBounds(parents);
        result = new ParameterConfig[](right - left + 1);
        for (uint256 i = left; i <= right; ++i) {
            result[i] = _unpack(
                scopeConfig,
                compValues,
                parents,
                compressions,
                i
            );
        }
    }

    function _unpack(
        BitmapBuffer memory scopeConfig,
        BitmapBuffer memory compValues,
        uint8[] memory parents,
        Compression.Mode[] memory compressions,
        uint256 index
    ) private pure returns (ParameterConfig memory result) {
        ScopeConfig.unpackParameter(scopeConfig, index, result);
        result.compValue = _compValue(compValues, compressions, index);

        (uint256 left, uint256 right) = Topology.childrenBounds(parents, index);
        if (left <= right) {
            result.children = new ParameterConfig[](right - left + 1);
            for (uint256 j = left; j <= right; j++) {
                result.children[j - left] = _unpack(
                    scopeConfig,
                    compValues,
                    parents,
                    compressions,
                    j
                );
            }
        }
    }

    function _compValue(
        BitmapBuffer memory compValues,
        Compression.Mode[] memory compressions,
        uint256 index
    ) private pure returns (bytes32 compValue) {
        Compression.Mode compression = compressions[index];

        if (compression == Compression.Mode.Empty) {
            return 0;
        }

        uint256 offset = 5;
        for (uint256 i; i < index; ++i) {
            offset += CompValues.packedSize(
                compValues,
                compressions[i],
                offset
            );
        }

        return CompValues.unpack(compValues, compression, offset);
    }
}
