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
        ParameterConfigFlat[] calldata config,
        ExecutionOptions options
    ) internal virtual;

    function _load(
        Role storage role,
        bytes32 key
    ) internal view virtual returns (ParameterConfig memory result);

    function _key(
        address targetAddress,
        bytes4 selector
    ) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(targetAddress, selector));
    }

    function _key(bytes32 key, uint256 i) internal pure returns (bytes32) {
        return bytes32(abi.encodePacked(bytes24(key), uint8(i)));
    }

    function accruedAllowance(
        Allowance memory allowance,
        uint256 timestamp
    ) internal pure returns (uint128 balance, uint64 refillTimestamp) {
        if (
            allowance.refillInterval == 0 ||
            timestamp < allowance.refillTimestamp
        ) {
            return (allowance.balance, allowance.refillTimestamp);
        }

        uint64 elapsedIntervals = (uint64(timestamp) -
            allowance.refillTimestamp) / allowance.refillInterval;

        uint128 uncappedBalance = allowance.balance +
            allowance.refillAmount *
            elapsedIntervals;

        balance = uncappedBalance < allowance.maxBalance
            ? uncappedBalance
            : allowance.maxBalance;

        refillTimestamp =
            allowance.refillTimestamp +
            elapsedIntervals *
            allowance.refillInterval;
    }
}
