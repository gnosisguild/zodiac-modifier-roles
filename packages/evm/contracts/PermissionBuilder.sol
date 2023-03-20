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
    /// Allowance exceeded
    error AllowanceExceeded(uint16 allowanceId);
    /// Allowance exceeded
    error ETHAllowanceExceeded(uint16 allowanceId);
    /// Allowance exceeded
    error CallAllowanceExceeded(uint16 allowanceId);

    event AllowTarget(
        uint16 role,
        address targetAddress,
        ExecutionOptions options
    );
    event RevokeTarget(uint16 role, address targetAddress);
    event ScopeTarget(uint16 role, address targetAddress);

    event AllowFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    );
    event RevokeFunction(uint16 role, address targetAddress, bytes4 selector);
    event ScopeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        ConditionFlat[] conditions,
        ExecutionOptions options
    );

    /// @dev Allows transactions to a target address.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function allowTarget(
        uint16 roleId,
        address targetAddress,
        ExecutionOptions options
    ) external onlyOwner {
        roles[roleId].targets[targetAddress] = TargetAddress(
            Clearance.Target,
            options
        );
        emit AllowTarget(roleId, targetAddress, options);
    }

    /// @dev Removes transactions to a target address.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function revokeTarget(
        uint16 roleId,
        address targetAddress
    ) external onlyOwner {
        roles[roleId].targets[targetAddress] = TargetAddress(
            Clearance.None,
            ExecutionOptions.None
        );
        emit RevokeTarget(roleId, targetAddress);
    }

    /// @dev Designates only specific functions can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    function scopeTarget(
        uint16 roleId,
        address targetAddress
    ) external onlyOwner {
        roles[roleId].targets[targetAddress] = TargetAddress(
            Clearance.Function,
            ExecutionOptions.None
        );
        emit ScopeTarget(roleId, targetAddress);
    }

    /// @dev Specifies the functions that can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function allowFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    ) external onlyOwner {
        roles[roleId].scopeConfig[_key(targetAddress, selector)] = ScopeConfig
            .packHeader(0, true, options, address(0));

        emit AllowFunction(roleId, targetAddress, selector, options);
    }

    /// @dev Removes the functions that can be called.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    function revokeFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector
    ) external onlyOwner {
        delete roles[roleId].scopeConfig[_key(targetAddress, selector)];
        emit RevokeFunction(roleId, targetAddress, selector);
    }

    /// @dev Defines the values that can be called for a given function for each param.
    /// @param roleId identifier of the role to be modified.
    /// @param targetAddress Destination address of transaction.
    /// @param selector 4 byte function selector.
    /// @param options designates if a transaction can send ether and/or delegatecall to target.
    function scopeFunction(
        uint16 roleId,
        address targetAddress,
        bytes4 selector,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) external onlyOwner {
        Integrity.enforce(conditions);
        _removeExtraneousOffsets(conditions);

        _store(
            roles[roleId],
            _key(targetAddress, selector),
            conditions,
            options
        );

        emit ScopeFunction(
            roleId,
            targetAddress,
            selector,
            conditions,
            options
        );
    }

    function setAllowance(
        uint16 id,
        uint128 balance,
        uint128 maxBalance,
        uint128 refillAmount,
        uint64 refillInterval,
        uint64 refillTimestamp
    ) external onlyOwner {
        allowances[id] = Allowance({
            refillAmount: refillAmount,
            refillInterval: refillInterval,
            refillTimestamp: refillTimestamp,
            balance: balance,
            maxBalance: maxBalance > 0 ? maxBalance : type(uint128).max
        });
    }

    function _track(Trace[] memory entries) internal {
        uint256 paramCount = entries.length;
        for (uint256 i; i < paramCount; ) {
            Condition memory condition = entries[i].condition;
            uint256 value = entries[i].value;

            uint16 allowanceId = uint16(uint256(bytes32(condition.compValue)));
            Allowance memory allowance = allowances[allowanceId];
            (uint128 balance, uint64 refillTimestamp) = _accruedAllowance(
                allowance,
                block.timestamp
            );

            if (value > balance) {
                if (condition.operator == Operator.WithinAllowance) {
                    revert AllowanceExceeded(allowanceId);
                } else if (condition.operator == Operator.ETHWithinAllowance) {
                    revert ETHAllowanceExceeded(allowanceId);
                } else {
                    revert CallAllowanceExceeded(allowanceId);
                }
            }
            allowances[allowanceId].balance = balance - uint128(value);
            allowances[allowanceId].refillTimestamp = refillTimestamp;

            unchecked {
                ++i;
            }
        }
    }

    function _accruedAllowance(
        Allowance memory allowance,
        uint256 timestamp
    ) private pure returns (uint128 balance, uint64 refillTimestamp) {
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
