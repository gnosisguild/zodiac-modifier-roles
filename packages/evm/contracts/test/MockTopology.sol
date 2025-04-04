// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Topology.sol";

contract MockTopology {
    function typeTree(
        ConditionFlat[] memory conditions,
        uint256 entrypoint
    ) public pure returns (AbiTypeTree[] memory result) {
        return
            Topology.typeTree(
                conditions,
                entrypoint,
                Topology.childrenBounds(conditions)
            );
    }

    function typeTree(
        ConditionFlat[] memory conditions
    ) public pure returns (AbiTypeTree[] memory result) {
        return
            Topology.typeTree(
                conditions,
                0,
                Topology.childrenBounds(conditions)
            );
    }
}
