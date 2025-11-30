// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Storage.sol";

import "../common/ImmutableStorage.sol";
import "../common/ScopeConfig.sol";

import "./condition/transform/ConditionsTransform.sol";

import {TargetAddress, Clearance} from "../types/Permission.sol";

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
 *      │   Used when Clearance.Function
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

        emit RolesModSetup(msg.sender, _owner, _avatar, _target);
    }

    /*//////////////////////////////////////////////////////////////
                           ROLE MEMBERSHIP
    //////////////////////////////////////////////////////////////*/

    /// @dev Assigns and revokes roles to a given module.
    /// @param module Module on which to assign/revoke roles.
    /// @param roleKeys Roles to assign/revoke.
    /// @param memberOf Assign (true) or revoke (false) corresponding roleKeys.
    function assignRoles(
        address module,
        bytes32[] calldata roleKeys,
        bool[] calldata memberOf
    ) external onlyOwner {
        if (roleKeys.length != memberOf.length) {
            revert ArraysDifferentLength();
        }
        for (uint16 i; i < roleKeys.length; ++i) {
            roles[roleKeys[i]].members[module] = memberOf[i];
        }
        if (!isModuleEnabled(module)) {
            enableModule(module);
        }
        emit AssignRoles(module, roleKeys, memberOf);
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
        bytes memory buffer = ConditionsTransform.pack(conditions);
        address pointer = ImmutableStorage.store(buffer);

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
