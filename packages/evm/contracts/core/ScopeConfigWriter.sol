// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./conditions/serialize/Integrity.sol";
import "./conditions/serialize/Serializer.sol";

import "../libraries/ImmutableStorage.sol";
import "../libraries/ScopeConfig.sol";

import "../types/All.sol";

library ScopeConfigWriter {
    function store(
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) external returns (bytes32) {
        Integrity.enforce(conditions);

        bytes memory buffer = Serializer.serialize(conditions);

        address pointer = ImmutableStorage.store(buffer);

        return ScopeConfig.pack(options, pointer);
    }
}
