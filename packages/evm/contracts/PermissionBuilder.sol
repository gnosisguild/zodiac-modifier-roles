// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./Core.sol";
import "./Integrity.sol";
import "./Topology.sol";
import "./ScopeConfig.sol";

abstract contract PermissionBuilder is Core {
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
        ParameterConfigFlat[] parameters,
        ExecutionOptions options
    );

    error AllowanceDoubleSpend(uint16 allowanceId);

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
        ParameterConfigFlat[] memory parameters,
        ExecutionOptions options
    ) external onlyOwner {
        Integrity.validate(parameters);
        _removeExtraneousOffsets(parameters);

        _store(
            roles[roleId],
            _key(targetAddress, selector),
            parameters,
            options
        );

        emit ScopeFunction(
            roleId,
            targetAddress,
            selector,
            parameters,
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
            ParameterConfig memory parameter = entries[i].condition;
            uint256 value = entries[i].value;

            uint16 allowanceId = uint16(uint256(bytes32(parameter.compValue)));
            Allowance memory allowance = allowances[allowanceId];
            (uint128 balance, uint64 refillTimestamp) = _accruedAllowance(
                allowance,
                block.timestamp
            );
            // This was already previously authorized at the checker pass.
            // However, it is possible that the same limit is used across
            // different parameters (which is not very common), but it's
            // something we don't want to restrict. Therefore, we read from
            // storage again (we don't rely on the allowance value initially
            // loaded to ParameterConfig). We repeat the accrual math and consider
            // that if it fails here, then it may be due to a double spend.
            if (value > balance) {
                revert AllowanceDoubleSpend(allowanceId);
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
    ) internal pure override returns (uint128 balance, uint64 refillTimestamp) {
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
        ParameterConfigFlat[] memory parameters
    ) private pure returns (ParameterConfigFlat[] memory) {
        uint256 paramCount = parameters.length;
        for (uint256 i; i < paramCount; ) {
            if (
                parameters[i].comp == Comparison.EqualTo &&
                Topology.isInline(parameters, i) == false
            ) {
                bytes memory compValue = parameters[i].compValue;
                uint256 length = compValue.length;
                assembly {
                    compValue := add(compValue, 32)
                    mstore(compValue, sub(length, 32))
                }
                parameters[i].compValue = compValue;
            }

            unchecked {
                ++i;
            }
        }
        return parameters;
    }
}
