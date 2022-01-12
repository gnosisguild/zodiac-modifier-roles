// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

enum Clearance {
    NONE,
    TARGET,
    FUNCTION
}

enum Comparison {
    EqualTo,
    GreaterThan,
    LessThan,
    OneOf
}

struct TargetAddress {
    Clearance clearance;
    bool canSend;
    bool canDelegate;
}

struct Role {
    mapping(address => bool) members;
    mapping(address => TargetAddress) targets;
    mapping(bytes32 => uint256) functions;
    mapping(bytes32 => bytes32) compValues;
    mapping(bytes32 => bytes32[]) compValuesOneOf;
}

library Permissions {
    uint256 internal constant SCOPE_WILDCARD = 2**256 - 1;
    uint256 internal constant SCOPE_MAX_PARAMS = 62;
    // 62 bit mask
    uint256 internal constant IS_SCOPED_MASK =
        uint256(0x3fffffffffffffff << (62 + 124));

    /// Arrays must be the same length
    error ArraysDifferentLength();

    /// Function signature too short
    error FunctionSignatureTooShort();

    /// Role not allowed to delegate call to target address
    error DelegateCallNotAllowed();

    /// Role not allowed to call target address
    error TargetAddressNotAllowed();

    /// Role not allowed to call this function on target address
    error FunctionNotAllowed();

    /// Role not allowed to send to target address
    error SendNotAllowed();

    /// Role not allowed to use bytes for parameter
    error ParameterNotAllowed();

    /// Role not allowed to use bytes for parameter
    error ParameterNotOneOfAllowed();

    /// Role not allowed to use bytes less than value for parameter
    error ParameterLessThanAllowed();

    /// Role not allowed to use bytes greater than value for parameter
    error ParameterGreaterThanAllowed();

    /// only multisend txs with an offset of 32 bytes are allowed
    error UnacceptableMultiSendOffset();

    /// OneOf Comparison must be set via dedicated function
    error UnsuitableOneOfComparison();

    /// Not possible to define gt/lt for Dynamic types
    error UnsuitableRelativeComparison();

    /// Exceeds the max number of params supported
    error ScopeMaxParametersExceeded();

    /// Not possible to a compValue of more than 32 bytes for non static type
    error StaticCompValueSizeExceeded();

    /*
     *
     * CHECKERS
     *
     */

    /// @dev Splits a multisend data blob into transactions and forwards them to be checked.
    /// @param data the packed transaction data (created by utils function buildMultiSendSafeTx).
    /// @param role Role to check for.
    function checkMultisendTransaction(Role storage role, bytes memory data)
        public
        view
    {
        Enum.Operation operation;
        address to;
        uint256 value;
        bytes memory out;
        uint256 dataLength;

        uint256 offset;
        assembly {
            offset := mload(add(data, 36))
        }
        if (offset != 32) {
            revert UnacceptableMultiSendOffset();
        }

        // transaction data (1st tx operation) reads at byte 100,
        // 4 bytes (multisend_id) + 32 bytes (offset_multisend_data) + 32 bytes multisend_data_length
        // increment i by the transaction data length
        // + 85 bytes of the to, value, and operation bytes until we reach the end of the data
        for (uint256 i = 100; i < data.length; i += (85 + dataLength)) {
            assembly {
                // First byte of the data is the operation.
                // We shift by 248 bits (256 - 8 [operation byte]) right since mload will always load 32 bytes (a word).
                // This will also zero out unused data.
                operation := shr(0xf8, mload(add(data, i)))
                // We offset the load address by 1 byte (operation byte)
                // We shift it right by 96 bits (256 - 160 [20 address bytes]) to right-align the data and zero out unused data.
                to := shr(0x60, mload(add(data, add(i, 0x01))))
                // We offset the load address by 21 byte (operation byte + 20 address bytes)
                value := mload(add(data, add(i, 0x15)))
                // We offset the load address by 53 byte (operation byte + 20 address bytes + 32 value bytes)
                dataLength := mload(add(data, add(i, 0x35)))
                // We offset the load address by 85 byte (operation byte + 20 address bytes + 32 value bytes + 32 data length bytes)
                out := add(data, add(i, 0x35))
            }
            checkTransaction(role, to, value, out, operation);
        }
    }

    function checkTransaction(
        Role storage role,
        address targetAddress,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) public view {
        TargetAddress memory target = role.targets[targetAddress];

        // transversal checks
        if (value > 0 && !target.canSend) {
            revert SendNotAllowed();
        }

        if (operation == Enum.Operation.DelegateCall && !target.canDelegate) {
            revert DelegateCallNotAllowed();
        }

        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        /*
         * For each address we have three clearance checks:
         * Forbidden     - nothing was setup
         * AddressPass   - address is go, nothing more to check
         * FunctionCheck - some functions on this address are allowed
         */

        if (target.clearance == Clearance.NONE) {
            revert TargetAddressNotAllowed();
        }

        if (target.clearance == Clearance.TARGET) {
            return;
        }

        if (target.clearance == Clearance.FUNCTION) {
            uint256 scopeConfig = role.functions[
                keyForFunctions(targetAddress, bytes4(data))
            ];

            if (scopeConfig == SCOPE_WILDCARD) {
                return;
            } else if (scopeConfig & IS_SCOPED_MASK == 0) {
                // is there no single param scoped?
                // either config bug or unset
                // semantically the same, not allowed
                revert FunctionNotAllowed();
            } else {
                checkParameters(role, scopeConfig, targetAddress, data);
            }
        }
    }

    /// @dev Will revert if a transaction has a parameter that is not allowed
    /// @param role reference to role storage
    /// @param targetAddress Address to check.
    /// @param data the transaction data to check
    function checkParameters(
        Role storage role,
        uint256 scopeConfig,
        address targetAddress,
        bytes memory data
    ) public view {
        bytes4 functionSig = bytes4(data);
        uint8 paramCount = unpackLength(scopeConfig);

        for (uint8 i = 0; i < paramCount; i++) {
            (
                bool isParamScoped,
                bool isParamDynamic,
                Comparison compType
            ) = unpackEntry(scopeConfig, i);

            if (!isParamScoped) {
                continue;
            }

            bytes32 value;
            if (isParamDynamic) {
                value = pluckDynamicParamValue(data, i);
            } else {
                value = pluckParamValue(data, i);
            }

            bytes32 key = keyForCompValues(targetAddress, functionSig, i);
            if (compType != Comparison.OneOf) {
                compare(compType, role.compValues[key], value);
            } else {
                compareOneOf(role.compValuesOneOf[key], value);
            }
        }
    }

    function compare(
        Comparison compType,
        bytes32 compValue,
        bytes32 value
    ) internal pure {
        if (compType == Comparison.EqualTo && value != compValue) {
            revert ParameterNotAllowed();
        } else if (compType == Comparison.GreaterThan && value <= compValue) {
            revert ParameterLessThanAllowed();
        } else if (compType == Comparison.LessThan && value >= compValue) {
            revert ParameterGreaterThanAllowed();
        }
    }

    function compareOneOf(bytes32[] storage compValue, bytes32 value)
        internal
        view
    {
        for (uint256 i = 0; i < compValue.length; i++) {
            if (value == compValue[i]) return;
        }
        revert ParameterNotOneOfAllowed();
    }

    /*
     *
     * SETTERS
     *
     */
    function scopeAllowFunction(
        Role storage role,
        address targetAddress,
        bytes4 functionSig
    ) external {
        role.functions[
            keyForFunctions(targetAddress, functionSig)
        ] = SCOPE_WILDCARD;
    }

    function scopeRevokeFunction(
        Role storage role,
        address targetAddress,
        bytes4 functionSig
    ) external {
        // would a delete be more performant?
        role.functions[keyForFunctions(targetAddress, functionSig)] = 0;
    }

    function scopeFunction(
        Role storage role,
        address targetAddress,
        bytes4 functionSig,
        bool[] calldata isParamScoped,
        bool[] calldata isParamDynamic,
        Comparison[] calldata paramCompType,
        bytes[] calldata paramCompValue
    ) external {
        if (
            isParamScoped.length != isParamDynamic.length ||
            isParamScoped.length != paramCompType.length ||
            isParamScoped.length != paramCompValue.length
        ) {
            revert ArraysDifferentLength();
        }

        if (isParamScoped.length > SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        for (uint256 i = 0; i < isParamDynamic.length; i++) {
            if (isParamScoped[i]) {
                enforceCompType(isParamDynamic[i], paramCompType[i]);
                enforceCompValue(isParamDynamic[i], paramCompValue[i]);
            }
        }

        uint256 scopeConfig = scopeConfigCreate(
            isParamScoped,
            isParamDynamic,
            paramCompType
        );

        // set scopeConfig
        role.functions[
            keyForFunctions(targetAddress, functionSig)
        ] = scopeConfig;

        // set respective compValues
        for (uint8 i = 0; i < paramCompType.length; i++) {
            role.compValues[
                keyForCompValues(targetAddress, functionSig, i)
            ] = compressCompValue(isParamDynamic[i], paramCompValue[i]);
        }
    }

    function scopeParameter(
        Role storage role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isDynamic,
        Comparison compType,
        bytes calldata compValue
    ) external {
        if (paramIndex >= SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        enforceCompType(isDynamic, compType);
        enforceCompValue(isDynamic, compValue);

        // set scopeConfig
        bytes32 key = keyForFunctions(targetAddress, functionSig);
        uint256 scopeConfig = scopeConfigSet(
            role.functions[key],
            paramIndex,
            true,
            isDynamic,
            compType
        );
        role.functions[key] = scopeConfig;

        // set compValue
        role.compValues[
            keyForCompValues(targetAddress, functionSig, paramIndex)
        ] = compressCompValue(isDynamic, compValue);
    }

    function scopeParameterAsOneOf(
        Role storage role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        bool isDynamic,
        bytes[] calldata compValues
    ) external {
        if (paramIndex >= SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        for (uint256 i = 0; i < compValues.length; i++) {
            enforceCompValue(isDynamic, compValues[i]);
        }

        // set scopeConfig
        bytes32 key = keyForFunctions(targetAddress, functionSig);
        uint256 scopeConfig = scopeConfigSet(
            role.functions[key],
            paramIndex,
            true,
            isDynamic,
            Comparison.OneOf
        );
        role.functions[key] = scopeConfig;

        // set compValue
        key = keyForCompValues(targetAddress, functionSig, paramIndex);

        role.compValuesOneOf[key] = new bytes32[](compValues.length);
        for (uint256 i = 0; i < compValues.length; i++) {
            role.compValuesOneOf[key][i] = compressCompValue(
                isDynamic,
                compValues[i]
            );
        }
    }

    function unscopeParameter(
        Role storage role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex
    ) external {
        if (paramIndex >= SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        // set scopeConfig
        bytes32 key = keyForFunctions(targetAddress, functionSig);
        uint256 scopeConfig = scopeConfigSet(
            role.functions[key],
            paramIndex,
            false,
            false,
            Comparison(0)
        );
        role.functions[key] = scopeConfig;

        // set compValue
        key = keyForCompValues(targetAddress, functionSig, paramIndex);
        delete role.compValues[key];
        delete role.compValuesOneOf[key];
    }

    function enforceCompType(bool isDynamic, Comparison compType)
        internal
        pure
    {
        if (compType == Comparison.OneOf) {
            revert UnsuitableOneOfComparison();
        }

        if (isDynamic && (compType != Comparison.EqualTo)) {
            revert UnsuitableRelativeComparison();
        }
    }

    function enforceCompValue(bool isDynamic, bytes calldata compValue)
        internal
        pure
    {
        if (!isDynamic && compValue.length != 32) {
            revert StaticCompValueSizeExceeded();
        }
    }

    /*
     *
     * HELPERS
     *
     */
    function pluckDynamicParamValue(bytes memory data, uint256 paramIndex)
        internal
        pure
        returns (bytes32)
    {
        // get the pointer to the start of the buffer
        uint256 offset = 32 + 4 + paramIndex * 32;
        uint256 start;
        assembly {
            start := add(32, add(4, mload(add(data, offset))))
        }

        uint256 length;
        assembly {
            length := mload(add(data, start))
        }

        return keccak256(slice(data, start, start + length));
    }

    function pluckParamValue(bytes memory data, uint256 paramIndex)
        internal
        pure
        returns (bytes32)
    {
        uint256 offset = 32 + 4 + paramIndex * 32;
        bytes32 value;
        assembly {
            value := mload(add(data, offset))
        }
        return value;
    }

    function slice(
        bytes memory data,
        uint256 start,
        uint256 end
    ) internal pure returns (bytes memory result) {
        result = new bytes(end - start);
        uint256 i;
        for (uint256 j = start; j < end; j++) {
            result[i++] = data[j];
        }
    }

    function scopeConfigCreate(
        bool[] memory isParamScoped,
        bool[] memory isParamDynamic,
        Comparison[] memory paramCompType
    ) internal pure returns (uint256) {
        uint8 paramCount = uint8(isParamScoped.length);
        uint256 scopeConfig = packLength(0, paramCount);
        for (uint8 i = 0; i < paramCount; i++) {
            scopeConfig = packEntry(
                scopeConfig,
                i,
                isParamScoped[i],
                isParamDynamic[i],
                paramCompType[i]
            );
        }

        return scopeConfig;
    }

    function scopeConfigSet(
        uint256 scopeConfig,
        uint8 paramIndex,
        bool isScoped,
        bool isDynamic,
        Comparison compType
    ) internal pure returns (uint256) {
        if (scopeConfig == SCOPE_WILDCARD) scopeConfig = 0;
        uint8 prevParamCount = unpackLength(scopeConfig);

        uint8 nextParamCount = paramIndex + 1 > prevParamCount
            ? paramIndex + 1
            : prevParamCount;

        return
            packEntry(
                packLength(scopeConfig, nextParamCount),
                paramIndex,
                isScoped,
                isDynamic,
                compType
            );
    }

    function packEntry(
        uint256 scopeConfig,
        uint8 paramIndex,
        bool isScoped,
        bool isDynamic,
        Comparison compType
    ) internal pure returns (uint256) {
        // we restrict paramCount to 62:
        // 8   bits -> length
        // 62  bits -> isParamScoped
        // 62  bits -> isParamDynamic
        // 124 bits -> two bits for each compType 62*2 = 124
        uint256 isScopedMask = 1 << (paramIndex + 62 + 124);
        uint256 isDynamicMask = 1 << (paramIndex + 124);
        uint256 compTypeMask = 3 << (paramIndex * 2);

        if (isScoped) {
            scopeConfig |= isScopedMask;
        } else {
            scopeConfig &= ~isScopedMask;
        }

        if (isDynamic) {
            scopeConfig |= isDynamicMask;
        } else {
            scopeConfig &= ~isDynamicMask;
        }

        scopeConfig &= ~compTypeMask;
        scopeConfig |= uint256(compType) << (paramIndex * 2);

        return scopeConfig;
    }

    function packLength(uint256 scopeConfig, uint8 paramCount)
        internal
        pure
        returns (uint256)
    {
        // 8   bits -> length
        // 62  bits -> isParamScoped
        // 62  bits -> isParamDynamic
        // 124 bits -> two bits represents for each compType 62*2 = 124
        uint256 left = (uint256(paramCount) << (62 + 62 + 124));
        uint256 right = (scopeConfig << 8) >> 8;
        return left | right;
    }

    function unpackEntry(uint256 scopeConfig, uint8 paramIndex)
        internal
        pure
        returns (
            bool isScoped,
            bool isDynamic,
            Comparison compType
        )
    {
        uint256 isScopedMask = 1 << (paramIndex + 62 + 124);
        uint256 isDynamicMask = 1 << (paramIndex + 124);
        uint256 compTypeMask = 3 << (2 * paramIndex);

        isScoped = (scopeConfig & isScopedMask) != 0;
        isDynamic = (scopeConfig & isDynamicMask) != 0;
        compType = Comparison((scopeConfig & compTypeMask) >> (2 * paramIndex));
    }

    function unpackLength(uint256 scopeConfig) internal pure returns (uint8) {
        return uint8(scopeConfig >> 248);
    }

    function keyForFunctions(address targetAddress, bytes4 functionSig)
        public
        pure
        returns (bytes32)
    {
        // fits in 32 bytes
        return bytes32(abi.encodePacked(targetAddress, functionSig));
    }

    function keyForCompValues(
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex
    ) public pure returns (bytes32) {
        // fits in 32 bytes
        return
            bytes32(abi.encodePacked(targetAddress, functionSig, paramIndex));
    }

    function compressCompValue(bool isDynamic, bytes calldata compValue)
        internal
        pure
        returns (bytes32)
    {
        return isDynamic ? keccak256(compValue) : bytes32(compValue);
    }
}
