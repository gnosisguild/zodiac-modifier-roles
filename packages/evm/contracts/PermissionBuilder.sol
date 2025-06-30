// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./_Core.sol";
import "./Integrity.sol";

import "./packers/BufferPacker.sol";

/**
 * @title PermissionBuilder - a component of the Zodiac Roles Mod that is
 * responsible for constructing, managing, granting, and revoking all types
 * of permission data.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */
abstract contract PermissionBuilder is Core {
    event AllowTarget(
        bytes32 roleKey,
        address targetAddress,
        ExecutionOptions options
    );
    event RevokeTarget(bytes32 roleKey, address targetAddress);
    event ScopeTarget(bytes32 roleKey, address targetAddress);

    event AllowFunction(
        bytes32 roleKey,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    );
    event RevokeFunction(
        bytes32 roleKey,
        address targetAddress,
        bytes4 selector
    );
    event ScopeFunction(
        bytes32 roleKey,
        address targetAddress,
        bytes4 selector,
        ConditionFlat[] conditions,
        ExecutionOptions options
    );

    event SetAllowance(
        bytes32 allowanceKey,
        uint128 balance,
        uint128 maxRefill,
        uint128 refill,
        uint64 period,
        uint64 timestamp
    );

    /// @dev Allows transactions to a target address.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function allowTarget(
        bytes32 roleKey,
        address targetAddress,
        ExecutionOptions options
    ) external onlyOwner {
        roles[roleKey].targets[targetAddress] = TargetAddress({
            clearance: Clearance.Target,
            options: options
        });
        emit AllowTarget(roleKey, targetAddress, options);
    }

    /// @dev Removes transactions to a target address.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function revokeTarget(
        bytes32 roleKey,
        address targetAddress
    ) external onlyOwner {
        roles[roleKey].targets[targetAddress] = TargetAddress({
            clearance: Clearance.None,
            options: ExecutionOptions.None
        });
        emit RevokeTarget(roleKey, targetAddress);
    }

    /// @dev Designates only specific functions can be called.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function scopeTarget(
        bytes32 roleKey,
        address targetAddress
    ) external onlyOwner {
        roles[roleKey].targets[targetAddress] = TargetAddress({
            clearance: Clearance.Function,
            options: ExecutionOptions.None
        });
        emit ScopeTarget(roleKey, targetAddress);
    }

    /// @dev Specifies the functions that can be called.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function allowFunction(
        bytes32 roleKey,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    ) external onlyOwner {
        roles[roleKey].scopeConfig[_key(targetAddress, selector)] = BufferPacker
            .packHeaderAsWildcarded(options);

        emit AllowFunction(roleKey, targetAddress, selector, options);
    }

    /// @dev Removes the functions that can be called.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    function revokeFunction(
        bytes32 roleKey,
        address targetAddress,
        bytes4 selector
    ) external onlyOwner {
        delete roles[roleKey].scopeConfig[_key(targetAddress, selector)];
        emit RevokeFunction(roleKey, targetAddress, selector);
    }

    /// @dev Sets conditions to enforce on calls to the specified target.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param conditions The conditions to enforce.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function scopeFunction(
        bytes32 roleKey,
        address targetAddress,
        bytes4 selector,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) external onlyOwner {
        Integrity.enforce(conditions);

        _store(
            roles[roleKey],
            _key(targetAddress, selector),
            conditions,
            options
        );

        emit ScopeFunction(
            roleKey,
            targetAddress,
            selector,
            conditions,
            options
        );
    }

    function setAllowance(
        bytes32 key,
        uint128 balance,
        uint128 maxRefill,
        uint128 refill,
        uint64 period,
        uint64 timestamp
    ) external onlyOwner {
        maxRefill = maxRefill != 0 ? maxRefill : type(uint128).max;
        timestamp = timestamp != 0 ? timestamp : uint64(block.timestamp);

        allowances[key] = Allowance({
            refill: refill,
            maxRefill: maxRefill,
            period: period,
            timestamp: timestamp,
            balance: balance
        });
        emit SetAllowance(key, balance, maxRefill, refill, period, timestamp);
    }
}
