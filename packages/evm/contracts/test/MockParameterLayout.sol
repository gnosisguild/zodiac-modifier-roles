// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../ParameterLayout.sol";

contract MockParameterLayout {
    function rootBounds(
        BitmapBuffer memory buffer
    ) external pure returns (Bounds memory bounds) {
        return ParameterLayout.rootBounds(buffer);
    }

    function childrenBounds(
        BitmapBuffer memory buffer,
        uint256 parent
    ) external pure returns (bool hasChildren, Bounds memory bounds) {
        return ParameterLayout.childrenBounds(buffer, parent);
    }
}
