// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "../Types.sol";

library CompValues {
    uint256 private constant offsetPage = 251;

    function packHeader(
        uint256 length
    ) internal pure returns (BitmapBuffer memory buffer) {
        uint256 pages = length + 1;
        uint256 header = pages << offsetPage;
        buffer.payload = new bytes32[](pages);
        buffer.payload[0] = bytes32(header);
    }

    function packCompValue(
        BitmapBuffer memory buffer,
        bytes32 compValue,
        uint256 index
    ) internal pure {
        buffer.payload[index + 1] = compValue;
    }

    function unpackCompValue(
        BitmapBuffer memory buffer,
        uint256 index
    ) internal pure returns (bytes32) {
        return bytes32(buffer.payload[index + 1]);
    }

    // function _parameterOffset(
    //     uint256 index
    // ) internal pure returns (uint256 page, uint256 offset) {
    //     unchecked {
    //         // jump over the header
    //         ++index;
    //     }

    //     page = index / pageCapacity;
    //     offset = 256 - ((index % pageCapacity) + 1) * chunkSize;
    // }

    // function _parameterBits(
    //     ParameterConfigFlat memory parameter
    // ) internal pure returns (uint256 bits) {
    //     bits = uint256(parameter.parent) << offsetParent;
    //     if (parameter.isScoped) {
    //         bits |= maskIsScoped;
    //     }
    //     bits |= uint256(parameter._type) << offsetParamType;
    //     bits |= uint256(parameter.comp) << offsetParamComp;
    // }

    // function _pageCount(
    //     uint256 length
    // ) internal pure returns (uint256 pageCount) {
    //     return ((length * chunkSize) / 256) + 1;
    // }
}
