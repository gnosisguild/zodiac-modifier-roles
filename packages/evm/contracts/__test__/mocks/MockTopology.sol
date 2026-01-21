// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../core/serialize/Topology.sol";

contract MockTopology {
    function resolve(
        ConditionFlat[] memory conditions
    ) public pure returns (Topology[] memory result) {
        result = TopologyLib.resolve(conditions);
    }
}
