// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Core.sol";
import "./Integrity.sol";
import "./Topology.sol";
import "./ScopeConfig.sol";

/**
 * @title PermissionBuilder - a component of the Zodiac Roles Mod that is
 * responsible for constructing, managing, granting, and revoking all types
 * of permission data.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.pm>
 */
abstract contract PermissionBuilder is Core {
    error UnsuitableMaxBalanceForAllowance();
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
        uint128 maxBalance,
        uint128 refillAmount,
        uint64 refillInterval,
        uint64 refillTimestamp
    );

    event ConsumeAllowance(
        bytes32 allowanceKey,
        uint128 consumed,
        uint128 newBalance
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
        roles[roleKey].targets[targetAddress] = TargetAddress(
            Clearance.Target,
            options
        );
        emit AllowTarget(roleKey, targetAddress, options);
    }

    /// @dev Removes transactions to a target address.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function revokeTarget(
        bytes32 roleKey,
        address targetAddress
    ) external onlyOwner {
        roles[roleKey].targets[targetAddress] = TargetAddress(
            Clearance.None,
            ExecutionOptions.None
        );
        emit RevokeTarget(roleKey, targetAddress);
    }

    /// @dev Designates only specific functions can be called.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function scopeTarget(
        bytes32 roleKey,
        address targetAddress
    ) external onlyOwner {
        roles[roleKey].targets[targetAddress] = TargetAddress(
            Clearance.Function,
            ExecutionOptions.None
        );
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
        roles[roleKey].scopeConfig[_key(targetAddress, selector)] = ScopeConfig
            .packHeader(0, true, options, address(0));

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

    /// @dev Defines the values that can be called for a given function for each param.
    /// @param roleKey identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function scopeFunction(
        bytes32 roleKey,
        address targetAddress,
        bytes4 selector,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) external onlyOwner {
        Integrity.enforce(conditions);
        _removeExtraneousOffsets(conditions);

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
        uint128 maxBalance,
        uint128 refillAmount,
        uint64 refillInterval,
        uint64 refillTimestamp
    ) external onlyOwner {
        maxBalance = maxBalance > 0 ? maxBalance : type(uint128).max;

        if (balance > maxBalance) {
            revert UnsuitableMaxBalanceForAllowance();
        }

        allowances[key] = Allowance({
            refillAmount: refillAmount,
            refillInterval: refillInterval,
            refillTimestamp: refillTimestamp,
            balance: balance,
            maxBalance: maxBalance
        });
        emit SetAllowance(
            key,
            balance,
            maxBalance,
            refillAmount,
            refillInterval,
            refillTimestamp
        );
    }

    /**
     * @dev Flushes the consumption of allowances back into storage.
     * @param consumptions The array of consumption structs containing
     * information about allowances and consumed amounts.
     */
    function _flush(Consumption[] memory consumptions) internal {
        uint256 paramCount = consumptions.length;
        for (uint256 i; i < paramCount; ) {
            bytes32 key = consumptions[i].allowanceKey;
            uint128 consumed = consumptions[i].consumed;

            // Retrieve the allowance and calculate its current updated balance
            // and next refill timestamp.
            Allowance memory allowance = allowances[key];
            (uint128 balance, uint64 refillTimestamp) = _accruedAllowance(
                allowance,
                block.timestamp
            );
            assert(balance == consumptions[i].balance);
            assert(consumed <= balance);

            // Flush
            allowances[key].balance = balance - consumed;
            allowances[key].refillTimestamp = refillTimestamp;

            // Emit an event to signal the total consumed amount.
            emit ConsumeAllowance(key, consumed, balance - consumed);

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Flushes the consumption of allowances back into storage.
     * @param consumptions The array of consumption structs containing
     * information about allowances and consumed amounts.
     */
    function _unflush(Consumption[] memory consumptions) internal {
        uint256 paramCount = consumptions.length;
        for (uint256 i; i < paramCount; ) {
            bytes32 key = consumptions[i].allowanceKey;
            uint128 consumed = consumptions[i].consumed;

            assert(
                allowances[key].balance + consumed <= allowances[key].maxBalance
            );
            // Flush
            allowances[key].balance += consumed;

            unchecked {
                ++i;
            }
        }
    }

    function _accruedAllowance(
        Allowance memory allowance,
        uint256 timestamp
    ) internal pure override returns (uint128 balance, uint64 refillTimestamp) {
        if (
            allowance.refillInterval == 0 ||
            timestamp < allowance.refillTimestamp + allowance.refillInterval
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

    /**
     * @dev This function removes unnecessary offsets from compValue fields of
     * the `conditions` array. Its purpose is to ensure a consistent API where
     * every `compValue` provided for use in `Operations.EqualsTo` is obtained
     * by calling `abi.encode` directly.
     *
     * By removing the leading extraneous offsets this function makes
     * abi.encode(...) match the output produced by Decoder inspection.
     * Without it, the encoded fields would need to be patched externally
     * depending on whether the payload is fully encoded inline or not.
     *
     * @param conditions Array of ConditionFlat structs to remove extraneous
     * offsets from
     */
    function _removeExtraneousOffsets(
        ConditionFlat[] memory conditions
    ) private pure returns (ConditionFlat[] memory) {
        uint256 count = conditions.length;
        for (uint256 i; i < count; ) {
            if (
                conditions[i].operator == Operator.EqualTo &&
                Topology.isInline(conditions, i) == false
            ) {
                bytes memory compValue = conditions[i].compValue;
                uint256 length = compValue.length;
                assembly {
                    compValue := add(compValue, 32)
                    mstore(compValue, sub(length, 32))
                }
                conditions[i].compValue = compValue;
            }

            unchecked {
                ++i;
            }
        }
        return conditions;
    }
}
