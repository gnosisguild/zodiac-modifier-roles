// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Types.sol";

abstract contract Core is OwnableUpgradeable {
    mapping(uint16 => Role) internal roles;
    mapping(uint16 => Allowance) public allowances;

    function _store(
        Role storage role,
        bytes32 key,
        ConditionFlat[] memory config,
        ExecutionOptions options
    ) internal virtual;

    function _load(
        Role storage role,
        bytes32 key
    ) internal view virtual returns (Condition memory result);

    function _accruedAllowance(
        Allowance memory allowance,
        uint256 timestamp
    ) internal pure virtual returns (uint128 balance, uint64 refillTimestamp);

    function _key(
        address targetAddress,
        bytes4 selector
    ) internal pure returns (bytes32) {
        /*
         * Unoptimized version:
         * bytes32(abi.encodePacked(targetAddress, selector))
         */
        return bytes32(bytes20(targetAddress)) | (bytes32(selector) >> 160);
    }
}
