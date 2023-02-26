// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Types.sol";

abstract contract Core is OwnableUpgradeable {
    mapping(uint16 => Role) internal roles;
    mapping(uint16 => Allowance) internal allowances;

    function _store(
        Role storage role,
        bytes32 key,
        ParameterConfigFlat[] calldata config,
        ExecutionOptions options
    ) internal virtual;

    function _load(
        Role storage role,
        bytes32 key
    ) internal view virtual returns (ParameterConfig[] memory result);

    function _key(
        address targetAddress,
        bytes4 selector
    ) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(targetAddress, selector));
    }

    function _key(bytes32 key, uint256 i) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(bytes24(key), uint8(i)));
    }
}
