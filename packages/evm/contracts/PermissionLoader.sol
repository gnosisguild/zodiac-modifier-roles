// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Core.sol";
import "./WriteOnce.sol";

import "./packers/PermissionPacker.sol";
import "./packers/PermissionUnpacker.sol";

/**
 * @title PermissionLoader - a component of the Zodiac Roles Mod that handles
 * the writing and reading of permission data to and from storage.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */
abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal override {
        bytes memory buffer = PermissionPacker.pack(conditions);
        address pointer = WriteOnce.store(buffer);

        role.scopeConfig[key] = BufferPacker.packHeader(
            conditions.length,
            options,
            pointer
        );
    }

    function _load(
        Role storage role,
        bytes32 key
    )
        internal
        view
        override
        returns (Condition memory condition, Consumption[] memory consumptions)
    {
        (uint256 paramCount, address pointer) = BufferPacker.unpackHeader(
            role.scopeConfig[key]
        );
        bytes memory buffer = WriteOnce.load(pointer);
        (condition, consumptions) = PermissionUnpacker.unpack(
            buffer,
            paramCount
        );

        for (uint256 i; i < consumptions.length; ++i) {
            (consumptions[i].balance, ) = _accruedAllowance(
                allowances[consumptions[i].allowanceKey],
                block.timestamp
            );
        }
    }
}
