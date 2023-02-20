// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";
import "./Compression.sol";

library ScopeConfig {
    // HEADER
    // 5   bits -> page
    // 8   bits -> length
    // 2   bits -> options
    // 1   bits -> isWildcarded
    // 3   bits -> unused
    uint256 private constant offsetPage = 251;
    uint256 private constant offsetLength = 243;
    uint256 private constant offsetOptions = 241;
    uint256 private constant offsetIsWildcarded = 240;
    uint256 private constant maskPage = 0x1f << offsetPage;
    uint256 private constant maskLength = 0xff << offsetLength;
    uint256 private constant maskOptions = 0x3 << offsetOptions;
    uint256 private constant maskIsWildcarded = 0x1 << offsetIsWildcarded;
    // PARAMETER:
    // 8    bits -> parent
    // 1    bit  -> isScoped
    // 3    bits -> type
    // 4    bits -> comparison
    // 3    bits -> compression
    uint256 private constant offsetParent = 11;
    uint256 private constant offsetIsScoped = 10;
    uint256 private constant offsetType = 7;
    uint256 private constant offsetComparison = 3;
    uint256 private constant offsetCompression = 0;
    uint256 private constant maskParent = 0xff << offsetParent;
    uint256 private constant maskIsScoped = 0x1 << offsetIsScoped;
    uint256 private constant maskType = 0x7 << offsetType;
    uint256 private constant maskComparison = 0xf << offsetComparison;
    uint256 private constant maskCompression = 0x7 << offsetCompression;
    uint256 private constant maskParameter = 0x7ffff;
    // sizes in bits
    // both header and parameter ought to be equal
    uint256 private constant chunkSize = 19;
    uint256 private constant pageCapacity = 256 / chunkSize;

    function create(
        uint256 length,
        bool isWildcarded,
        ExecutionOptions options
    ) internal pure returns (BitmapBuffer memory buffer) {
        uint256 page = _pageCount(length);
        buffer.payload = new bytes32[](page);
        buffer.payload[0] = packHeader(length, isWildcarded, options);
    }

    function packHeader(
        uint256 length,
        bool isWildcarded,
        ExecutionOptions options
    ) internal pure returns (bytes32) {
        uint256 page = _pageCount(length);
        uint256 header = page << offsetPage;
        header |= length << offsetLength;
        if (isWildcarded) {
            header |= maskIsWildcarded;
        }
        header |= uint256(options) << offsetOptions;

        return bytes32(header);
    }

    function packParameter(
        BitmapBuffer memory buffer,
        ParameterConfigFlat memory parameter,
        Compression.Mode compression,
        uint8 index
    ) internal pure {
        (uint256 page, uint256 offset) = _where(index);
        uint256 bits = _parameterBits(parameter, compression) << offset;
        uint256 mask = maskParameter << offset;

        buffer.payload[page] = bytes32(
            (uint256(buffer.payload[page]) & ~mask) | bits
        );
    }

    function unpackHeader(
        bytes32 header
    ) internal pure returns (bool isWildcarded, ExecutionOptions options) {
        isWildcarded = uint256(header) & maskIsWildcarded != 0;
        options = ExecutionOptions(
            (uint256(header) & maskOptions) >> offsetOptions
        );
    }

    function unpackParameter(
        BitmapBuffer memory buffer,
        uint256 index,
        ParameterConfig memory result
    ) internal pure {
        (uint256 page, uint256 offset) = _where(index);
        uint256 bits = (uint256(buffer.payload[page]) >> offset) &
            maskParameter;

        result.isScoped = (bits & maskIsScoped) != 0;
        result._type = ParameterType((bits & maskType) >> offsetType);
        result.comp = Comparison((bits & maskComparison) >> offsetComparison);
    }

    function unpackMisc(
        BitmapBuffer memory buffer
    )
        internal
        pure
        returns (uint8[] memory parents, Compression.Mode[] memory compressions)
    {
        uint256 head = uint256(buffer.payload[0]);
        uint256 length = (head & maskLength) >> offsetLength;

        parents = new uint8[](length);
        compressions = new Compression.Mode[](length);

        for (uint256 i; i < length; i++) {
            (uint256 page, uint256 offset) = _where(i);
            uint256 bits = uint256(buffer.payload[page] >> offset);

            parents[i] = uint8((bits & maskParent) >> offsetParent);
            compressions[i] = Compression.Mode(
                (bits & maskCompression) >> offsetCompression
            );
        }
    }

    function _where(
        uint256 index
    ) internal pure returns (uint256 page, uint256 offset) {
        unchecked {
            // jump over the header
            ++index;
        }

        page = index / pageCapacity;
        offset = 256 - ((index % pageCapacity) + 1) * chunkSize;
    }

    function _parameterBits(
        ParameterConfigFlat memory parameter,
        Compression.Mode compression
    ) private pure returns (uint256 bits) {
        bits = uint256(parameter.parent) << offsetParent;
        if (parameter.isScoped) {
            bits |= maskIsScoped;
        }
        bits |= uint256(parameter._type) << offsetType;
        bits |= uint256(parameter.comp) << offsetComparison;
        bits |= uint256(compression) << offsetCompression;
    }

    function _pageCount(
        uint256 length
    ) private pure returns (uint256 pageCount) {
        return ((length * chunkSize) / 256) + 1;
    }
}
