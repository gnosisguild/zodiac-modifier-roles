// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library ScopeConfig {
    // HEADER
    // 5   bits -> page
    // 8   bits -> length
    // 2   bits -> options
    // 1   bits -> isWildcarded
    uint256 private constant offsetPage = 251;
    uint256 private constant offsetLength = 243;
    uint256 private constant offsetOptions = 241;
    uint256 private constant offsetIsWildcarded = 240;
    uint256 private constant maskPage = 0x1f << offsetPage;
    uint256 private constant maskLength = 0xff << offsetLength;
    uint256 private constant maskOptions = 0x3 << offsetOptions;
    uint256 private constant maskIsWildcarded = 0x1 << offsetIsWildcarded;
    // PARAMETER:
    // parent     -> 8 bit
    // isScoped   -> 1 bit
    // paramType  -> 3 bits
    // paramComp  -> 4 bits
    uint256 private constant offsetParent = 8;
    uint256 private constant offsetIsScoped = 7;
    uint256 private constant offsetParamType = 4;
    uint256 private constant offsetParamComp = 0;
    uint256 private constant maskParent = 0xff << offsetParent;
    uint256 private constant maskIsScoped = 0x1 << offsetIsScoped;
    uint256 private constant maskParamType = 0x7 << offsetParamType;
    uint256 private constant maskParamComp = 0xf << offsetParamComp;
    uint256 private constant maskParameter = 0xffff;
    // sizes in bits
    // both header and parameter ought to be equal
    uint256 private constant chunkSize = 16;
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
        uint8 index
    ) internal pure {
        (uint256 page, uint256 offset) = _parameterOffset(index);
        uint256 bits = _parameterBits(parameter) << offset;
        uint256 mask = maskParameter << offset;

        buffer.payload[page] = bytes32(
            (uint256(buffer.payload[page]) & ~mask) | bits
        );
    }

    function unpackHeader(
        BitmapBuffer memory buffer
    ) internal pure returns (uint256, bool, ExecutionOptions) {
        return unpackHeader(buffer.payload[0]);
    }

    function unpackHeader(
        bytes32 header
    )
        internal
        pure
        returns (uint256 length, bool isWildcarded, ExecutionOptions options)
    {
        length = (uint256(header) & maskLength) >> offsetLength;
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
        (uint256 page, uint256 offset) = _parameterOffset(index);
        uint256 bits = (uint256(buffer.payload[page]) >> offset) &
            maskParameter;

        result.isScoped = (bits & maskIsScoped) != 0;
        result._type = ParameterType((bits & maskParamType) >> offsetParamType);
        result.comp = Comparison((bits & maskParamComp) >> offsetParamComp);
    }

    function unpackParent(
        BitmapBuffer memory buffer,
        uint256 index
    ) internal pure returns (uint8 parent) {
        (uint256 page, uint256 offset) = _parameterOffset(index);
        uint256 bits = (uint256(buffer.payload[page]) >> offset) &
            maskParameter;

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
    ) private pure returns (uint256 bits) {
        bits = uint256(parameter.parent) << offsetParent;
        if (parameter.isScoped) {
            bits |= maskIsScoped;
        }
        bits |= uint256(parameter._type) << offsetParamType;
        bits |= uint256(parameter.comp) << offsetParamComp;
    }

    function _pageCount(
        uint256 length
    ) private pure returns (uint256 pageCount) {
        return ((length * chunkSize) / 256) + 1;
    }
}
