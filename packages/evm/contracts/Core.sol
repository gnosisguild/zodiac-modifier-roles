// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Types.sol";

/**
 * @title Core is the base contract for the Zodiac Roles Mod, which defines
 * the common abstract connection points between Builder, Loader, and Checker.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
abstract contract Core is Modifier {
    mapping(bytes32 => Role) internal roles;
    mapping(bytes32 => Allowance) public allowances;

    function _store(
        Role storage role,
        bytes32 key,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal virtual;

    function _load(
        Role storage role,
        bytes32 key
    ) internal view virtual returns (Condition memory, Consumption[] memory);

    function _accruedAllowance(
        Allowance memory allowance,
        uint64 blockTimestamp
    ) internal pure virtual returns (uint128 balance, uint64 timestamp);

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
