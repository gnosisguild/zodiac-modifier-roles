// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../ParameterLayout.sol";

contract MockParameterLayout {
    function childrenBounds(
        BitmapBuffer memory buffer,
        uint256 parent
    ) external pure returns (uint256 left, uint256 right) {
        return ParameterLayout.childrenBounds(buffer, parent);
    }
}
