// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../Integrity.sol";

contract MockIntegrity {
    function enforce(ConditionFlat[] memory conditions) public pure {
        Integrity.enforce(conditions);
    }
}
