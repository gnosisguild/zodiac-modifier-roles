// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Consumptions.sol";

contract MockConsumptions {
    function merge(
        Consumption[] memory c1,
        Consumption[] memory c2
    ) public pure returns (Consumption[] memory result) {
        return Consumptions.merge(c1, c2);
    }
}
