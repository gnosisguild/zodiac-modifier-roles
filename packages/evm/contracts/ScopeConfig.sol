// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Types.sol";

library ScopeConfig {
    // HEADER
    // 8   bits -> length
    // 2   bits -> options
    // 1   bits -> isWildcarded
    // 5   bits -> unused
    uint256 private constant offsetLength = 248;
    uint256 private constant offsetOptions = 246;
    uint256 private constant offsetIsWildcarded = 245;
    uint256 private constant maskLength = 0xff << offsetLength;
    uint256 private constant maskOptions = 0x03 << offsetOptions;
    uint256 private constant maskIsWildcarded = 0x01 << offsetIsWildcarded;
    // PARAMETER:
    // parent     -> 8 bit
    // isScoped   -> 1 bit
    // paramType  -> 4 bits
    // paramComp  -> 3 bits
    uint256 private constant offsetParent = 8;
    uint256 private constant offsetIsScoped = 7;
    uint256 private constant offsetParamType = 3;
    uint256 private constant offsetParamComp = 0;
    uint256 private constant maskIsScoped = 0x01 << offsetIsScoped;
    uint256 private constant maskParameter = 0xffff;
    // sizes in bits
    // both header and parameter ought to be equal
    uint256 private constant chunkSize = 16;
    uint256 private constant pageCapacity = 256 / chunkSize;

    function store(Bitmap storage bitmap, BitmapBuffer memory buffer) internal {
        uint256 length = buffer.payload.length;
        for (uint256 i = 0; i < length; ++i) {
            bitmap.payload[i] = buffer.payload[i];
        }
    }

    function prune(Bitmap storage bitmap) internal {
        uint256 header = bitmap.payload[0];
        uint256 length = (header & maskLength) >> offsetLength;
        uint256 pageCount = _pageCount(length);
        for (uint256 i = 0; i < pageCount; ++i) {
            delete bitmap.payload[i];
        }
    }

    function load(
        Bitmap storage bitmap
    ) internal view returns (BitmapBuffer memory buffer) {
        uint256 header = bitmap.payload[0];
        uint256 length = (header & maskLength) >> offsetLength;
        uint256 pageCount = _pageCount(length);

        buffer.payload = new uint256[](pageCount);
        // save 100 gas by not repeating a storage read
        buffer.payload[0] = header;
        for (uint256 i = 1; i < pageCount; ++i) {
            buffer.payload[i] = bitmap.payload[i];
        }
    }

    function createBuffer(
        uint256 length,
        bool isWildcarded,
        ExecutionOptions options
    ) internal pure returns (BitmapBuffer memory buffer) {
        uint256 header = length << offsetLength;
        if (isWildcarded) {
            header |= maskIsWildcarded;
        }
        header |= uint256(options) << offsetOptions;

        buffer.payload = new uint256[](_pageCount(length));
        buffer.payload[0] = header;
    }

    function packParameter(
        BitmapBuffer memory buffer,
        ParameterConfigFlat memory parameter,
        uint8 index
    ) internal pure {
        (uint256 page, uint256 offset) = _parameterOffset(index);
        uint256 bits = _parameterBits(parameter) << offset;
        uint256 mask = maskParameter << offset;

        buffer.payload[page] = (buffer.payload[page] & ~mask) | bits;
    }

    function unpackHeader(
        uint256 header
    )
        internal
        pure
        returns (uint256 length, bool isWildcarded, ExecutionOptions options)
    {
        length = (header & maskLength) >> offsetLength;
        isWildcarded = header & maskIsWildcarded != 0;
        options = ExecutionOptions((header & maskOptions) >> offsetOptions);
    }

    function unpackHeader(
        BitmapBuffer memory buffer
    ) internal pure returns (uint256, bool, ExecutionOptions) {
        return unpackHeader(buffer.payload[0]);
    }

    function unpackParameter(
        BitmapBuffer memory buffer,
        uint256 index
    )
        internal
        pure
        returns (bool isScoped, ParameterType paramType, Comparison paramComp)
    {
        (uint256 page, uint256 offset) = _parameterOffset(index);
        uint256 bits = (buffer.payload[page] >> offset) & maskParameter;

        isScoped = (bits & (1 << 7)) != 0;
        paramType = ParameterType((bits >> 3) & 0xf);
        paramComp = Comparison(bits & 0x7);
    }

    function unpackParent(
        BitmapBuffer memory buffer,
        uint256 index
    ) internal pure returns (uint8 parent) {
        (uint256 page, uint256 offset) = _parameterOffset(index);
        uint256 bits = (buffer.payload[page] >> offset) & maskParameter;

        parent = uint8(bits >> offsetParent);
    }

    function _parameterOffset(
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
        ParameterConfigFlat memory parameter
    ) internal pure returns (uint256 bits) {
        bits = uint256(parameter.parent) << offsetParent;
        if (parameter.isScoped) {
            bits |= maskIsScoped;
        }
        bits |= uint256(parameter._type) << offsetParamType;
        bits |= uint256(parameter.comp);
    }

    function _pageCount(
        uint256 length
    ) internal pure returns (uint256 pageCount) {
        return ((length * chunkSize) / 256) + 1;
    }
}
