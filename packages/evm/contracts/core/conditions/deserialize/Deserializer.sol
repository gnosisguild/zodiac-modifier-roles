// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../../../libraries/ImmutableStorage.sol";
import "../../../libraries/ScopeConfig.sol";

import "./Unpacker.sol";

library Deserializer {
    function load(
        bytes32 scopeConfig
    ) internal view returns (Condition memory condition, Layout memory layout) {
        (, , address pointer) = ScopeConfig.unpack(scopeConfig);
        bytes memory buffer = ImmutableStorage.load(pointer);
        return Unpacker.unpack(buffer);
    }
}
