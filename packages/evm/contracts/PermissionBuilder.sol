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
    error InadequateAllowanceKey(uint256 length);

    error AllowanceExceeded(string allowanceKey);

    error CallAllowanceExceeded(string allowanceKey);

    error EtherAllowanceExceeded(string allowanceKey);

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
        bytes4 selector,
        ConditionFlat[] conditions,
        ExecutionOptions options
    );

    event SetAllowance(
        string allowanceKey,
        uint128 balance,
        uint128 maxBalance,
        uint128 refillAmount,
        uint64 refillInterval,
        uint64 refillTimestamp
    );

    event ConsumeAllowance(
        string allowanceKey,
        uint128 consumed,
        uint128 newBalance
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
        string memory allowanceKey,
        uint128 balance,
        uint128 maxBalance,
        uint128 refillAmount,
        uint64 refillInterval,
        uint64 refillTimestamp
    ) external onlyOwner {
        bytes memory rawKey = bytes(allowanceKey);
        if (rawKey.length == 0 || rawKey.length > 32) {
            revert InadequateAllowanceKey(rawKey.length);
        }
        allowances[allowanceKey] = Allowance({
            refillAmount: refillAmount,
            refillInterval: refillInterval,
            refillTimestamp: refillTimestamp,
            balance: balance,
            maxBalance: maxBalance > 0 ? maxBalance : type(uint128).max
        });
        emit SetAllowance(
            allowanceKey,
            balance,
            maxBalance,
            refillAmount,
            refillInterval,
            refillTimestamp
        );
    }

    function _track(Trace[] memory entries) internal {
        uint256 paramCount = entries.length;
        for (uint256 i; i < paramCount; ) {
            Condition memory condition = entries[i].condition;
            uint256 value = entries[i].value;

            string memory key = _wordToString(condition.compValue);
            Allowance memory allowance = allowances[key];
            (uint128 balance, uint64 refillTimestamp) = _accruedAllowance(
                allowance,
                block.timestamp
            );

            if (value > balance) {
                if (condition.operator == Operator.WithinAllowance) {
                    revert AllowanceExceeded(key);
                } else if (condition.operator == Operator.CallWithinAllowance) {
                    revert CallAllowanceExceeded(key);
                } else {
                    revert EtherAllowanceExceeded(key);
                }
            }
            allowances[key].balance = balance - uint128(value);
            allowances[key].refillTimestamp = refillTimestamp;

            emit ConsumeAllowance(
                key,
                uint128(value),
                balance - uint128(value)
            );
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

    /**
     * @dev removes extraneous leading offsets from the compValue fields
     * of the conditions array. Its purpose is to provide a consistent API
     * where every compValue provided to be used in Operations.EqualsTo is to be
     * produced simply by using abi.encode.
     *
     * By removing the leading extraneous offsets this function makes
     * abi.encode(...) match the output bounds produced by Decoder inspection.
     * Without it, the compValue fields would need to be modified externally
     * depending on whether the payload is fully encoded inline or not.
     *
     *
     * Additionally, this function normalizes the compValue fields that will be
     * stored as allowanceKeys, but removing offset and length.
     * @param conditions Array of ConditionFlat structs to remove extraneous
     * offsets from
     */
    function _removeExtraneousOffsets(
        ConditionFlat[] memory conditions
    ) private view returns (ConditionFlat[] memory) {
        uint256 count = conditions.length;
        for (uint256 i; i < count; ) {
            Operator operator = conditions[i].operator;

            bool isDynamicEquals = operator == Operator.EqualTo &&
                Topology.isInline(conditions, i) == false;
            if (isDynamicEquals) {
                bytes memory compValue = conditions[i].compValue;
                uint256 length = compValue.length;
                assembly {
                    compValue := add(compValue, 32)
                    mstore(compValue, sub(length, 32))
                }
                conditions[i].compValue = compValue;
            }

            bool isAllowance = operator == Operator.WithinAllowance ||
                operator == Operator.CallWithinAllowance ||
                operator == Operator.EtherWithinAllowance;
            if (isAllowance) {
                bytes memory compValue = conditions[i].compValue;
                assert(compValue.length == 96);

                assembly {
                    mstore(add(compValue, 32), 32)
                    compValue := add(compValue, 64)
                }
                conditions[i].compValue = compValue;
            }

            unchecked {
                ++i;
            }
        }
        return conditions;
    }

    function _wordToString(
        bytes32 word
    ) private returns (string memory result) {
        bytes32 mask = bytes32(bytes1(0xff));
        uint256 length;
        for (; mask != 0 && mask & word != 0; mask >>= 8) {
            length++;
        }

        result = string(abi.encodePacked(word));
        assembly {
            mstore(result, length)
        }
    }
}
