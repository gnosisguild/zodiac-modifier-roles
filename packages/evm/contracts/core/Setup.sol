// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "../common/ScopeConfig.sol";

import "./serialize/ConditionsTransform.sol";
import "./Storage.sol";

import {Clearance} from "../types/Permission.sol";

/*
 * Permission Model
 *
 * Role
 *  │
 *  ├─ members ───────────────────────► who can use this role
 *  │
 *  ├─ targets (address → Clearance)
 *  │   │
 *  │   ├─ Clearance.None ────────────► target blocked (default)
 *  │   │
 *  │   ├─ Clearance.Target ──────────► all functions allowed
 *  │   │                               + ExecutionOptions (send/delegatecall)
 *  │   │
 *  │   └─ Clearance.Function ────────► only specific functions allowed
 *  │                                   (see scopeConfig below)
 *  │
 *  └─ scopeConfig (target + selector → ScopeConfig)
 *      │
 *      │   Used when Clearance.Function (selector != 0)
 *      │   or Clearance.Target with conditions
 *      │
 *      ├─ not set ───────────────────► function blocked
 *      │
 *      ├─ wildcarded ────────────────► function allowed, no parameter checks
 *      │                               + ExecutionOptions
 *      │
 *      └─ scoped ────────────────────► function allowed with conditions
 *                                      + ExecutionOptions
 *                                      + Condition tree (parameter constraints)
 *
 * Allowances (separate storage, referenced by conditions)
 */

/**
 * @title Setup - Configuration and setup functions for Zodiac Roles Mod.
 *
 * @author gnosisguild
 */
abstract contract Setup is RolesStorage {
    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    function setUp(
        bytes memory initParams
    ) public virtual override initializer {
        (address _owner, address _avatar, address _target) = abi.decode(
            initParams,
            (address, address, address)
        );
        _transferOwnership(_owner);
        avatar = _avatar;
        target = _target;

        setupModules();

        emit RolesModSetup(msg.sender, _owner, _avatar, _target, VERSION);
    }

    /*//////////////////////////////////////////////////////////////
                           ROLE MEMBERSHIP
    //////////////////////////////////////////////////////////////*/

    /// @dev Assigns roles to a module (legacy function for backwards compatibility).
    /// @param module Module to assign roles to.
    /// @param roleKeys Roles to assign.
    /// @param memberOf true to grant, false to revoke.
    function assignRoles(
        address module,
        bytes32[] calldata roleKeys,
        bool[] calldata memberOf
    ) external onlyOwner {
        for (uint256 i; i < roleKeys.length; ++i) {
            bytes32 key = roleKeys[i];
            if (memberOf[i]) {
                grantRole(module, key, 0, 0, 0);
            } else {
                revokeRole(module, key);
            }
        }
    }

    /// @dev Grants a role to a module with optional session parameters.
    /// @param module Module to grant the role to.
    /// @param roleKey Role to grant.
    /// @param start Start timestamp (0 = immediately valid).
    /// @param end End timestamp (0 = never expires).
    /// @param usesLeft Number of uses (0 = unlimited).
    function grantRole(
        address module,
        bytes32 roleKey,
        uint64 start,
        uint64 end,
        uint128 usesLeft
    ) public onlyOwner {
        end = end != 0 ? end : type(uint64).max;
        usesLeft = usesLeft != 0 ? usesLeft : type(uint128).max;
        roles[roleKey].members[module] =
            (uint256(start) << 192) |
            (uint256(end) << 128) |
            uint256(usesLeft);
        if (!isModuleEnabled(module)) {
            enableModule(module);
        }
        emit GrantRole(roleKey, module, start, end, usesLeft);
    }

    /// @dev Revokes a role from a module.
    /// @param module Module to revoke the role from.
    /// @param roleKey Role to revoke.
    function revokeRole(address module, bytes32 roleKey) public onlyOwner {
        delete roles[roleKey].members[module];
        emit RevokeRole(roleKey, module);
    }

    /// @dev Allows a module to renounce its own role.
    /// @param roleKey Role to renounce.
    function renounceRole(bytes32 roleKey) external {
        delete roles[roleKey].members[msg.sender];
        emit RevokeRole(roleKey, msg.sender);
    }

    /// @dev Sets the default role used for a module if it calls
    ///      execTransactionFromModule() or execTransactionFromModuleReturnData().
    /// @param module Address of the module on which to set default role.
    /// @param roleKey Role to be set as default.
    function setDefaultRole(
        address module,
        bytes32 roleKey
    ) external onlyOwner {
        defaultRoles[module] = roleKey;
        emit SetDefaultRole(module, roleKey);
    }

    /*//////////////////////////////////////////////////////////////
                         TARGET PERMISSIONS
    //////////////////////////////////////////////////////////////*/

    /// @dev Allows transactions to a target address, optionally with conditions.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param conditions The conditions to enforce on all calls (empty for wildcarded).
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function allowTarget(
        bytes32 roleKey,
        address targetAddress,
        ConditionFlat[] calldata conditions,
        ExecutionOptions options
    ) external onlyOwner {
        bytes32 key = bytes32(bytes20(targetAddress)) | (~bytes32(0) >> 160);

        roles[roleKey].clearance[targetAddress] = Clearance.Target;
        roles[roleKey].scopeConfig[key] = conditions.length == 0
            ? ScopeConfig.packAsWildcarded(options)
            : ScopeConfig.pack(
                options,
                ConditionsTransform.packAndStore(conditions)
            );

        emit AllowTarget(roleKey, targetAddress, conditions, options);
    }

    /// @dev Designates only specific functions can be called.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function scopeTarget(
        bytes32 roleKey,
        address targetAddress
    ) external onlyOwner {
        roles[roleKey].clearance[targetAddress] = Clearance.Function;
        emit ScopeTarget(roleKey, targetAddress);
    }

    /// @dev Removes transactions to a target address.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function revokeTarget(
        bytes32 roleKey,
        address targetAddress
    ) external onlyOwner {
        delete roles[roleKey].clearance[targetAddress];
        emit RevokeTarget(roleKey, targetAddress);
    }

    /*//////////////////////////////////////////////////////////////
                        FUNCTION PERMISSIONS
    //////////////////////////////////////////////////////////////*/

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
        roles[roleKey].scopeConfig[_key(targetAddress, selector)] = ScopeConfig
            .packAsWildcarded(options);

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
        address pointer = ConditionsTransform.packAndStore(conditions);

        roles[roleKey].scopeConfig[_key(targetAddress, selector)] = ScopeConfig
            .pack(options, pointer);

        emit ScopeFunction(
            roleKey,
            targetAddress,
            selector,
            conditions,
            options
        );
    }

    /*//////////////////////////////////////////////////////////////
                             ALLOWANCES
    //////////////////////////////////////////////////////////////*/

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

    /// @dev Updates only the refill parameters of an existing allowance, preserving balance and timestamp.
    /// @param key The allowance key.
    /// @param maxRefill Cap at which refilling stops. Pass 0 to set to max uint128.
    /// @param refill Amount added to balance each period.
    /// @param period Refill interval in seconds.
    function updateAllowance(
        bytes32 key,
        uint128 maxRefill,
        uint128 refill,
        uint64 period
    ) external onlyOwner {
        maxRefill = maxRefill != 0 ? maxRefill : type(uint128).max;
        uint64 timestamp = allowances[key].timestamp;
        uint128 balance = allowances[key].balance;

        allowances[key].refill = refill;
        allowances[key].maxRefill = maxRefill;
        allowances[key].period = period;

        emit SetAllowance(key, balance, maxRefill, refill, period, timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                              ADAPTERS
    //////////////////////////////////////////////////////////////*/

    function setTransactionUnwrapper(
        address to,
        bytes4 selector,
        address adapter
    ) external onlyOwner {
        unwrappers[bytes32(bytes20(to)) | (bytes32(selector) >> 160)] = adapter;
        emit SetUnwrapAdapter(to, selector, adapter);
    }
}
