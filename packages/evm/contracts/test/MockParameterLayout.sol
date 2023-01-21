// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.9.0;

import "../ParameterLayout.sol";

contract MockParameterLayout {
    function rootBounds(
        ParameterConfigFlat[] memory configs
    ) external pure returns (Bounds memory bounds) {
        return ParameterLayout.rootBounds(configs);
    }

    function childrenBounds(
        ParameterConfigFlat[] memory configs,
        uint256 parent
    ) external pure returns (bool hasChildren, Bounds memory bounds) {
        return ParameterLayout.childrenBounds(configs, parent);
    }
}
