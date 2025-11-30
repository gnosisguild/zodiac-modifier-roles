// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../core/serialize/Topology.sol";

contract MockTopology {
    function isStructural(
        ConditionFlat[] memory conditions,
        uint256 index
    ) public pure returns (bool) {
        return Topology.isStructural(conditions, index);
    }

    function childBounds(
        ConditionFlat[] memory conditions,
        uint256 index
    )
        public
        pure
        returns (uint256 childStart, uint256 childCount, uint256 sChildCount)
    {
        return Topology.childBounds(conditions, index);
    }
}
