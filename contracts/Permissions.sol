// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

enum ParameterType {
    STATIC,
    DYNAMIC,
    DYNAMIC32
}

enum Comparison {
    EqualTo,
    GreaterThan,
    LessThan,
    OneOf
}

enum ExecutionOptions {
    NONE,
    SEND,
    DELEGATECALL,
    BOTH
}

enum Clearance {
    NONE,
    TARGET,
    FUNCTION
}

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
}

struct Role {
    mapping(address => bool) members;
    mapping(address => TargetAddress) targets;
    mapping(bytes32 => uint256) functions;
    mapping(bytes32 => bytes32) compValues;
    mapping(bytes32 => bytes32[]) compValuesOneOf;
}

library Permissions {
    uint256 internal constant SCOPE_MAX_PARAMS = 48;

    event AllowTarget(
        uint16 role,
        address targetAddress,
        ExecutionOptions options
    );
    event AllowTargetPartially(uint16 role, address targetAddress);
    event RevokeTarget(uint16 role, address targetAddress);
    event ScopeAllowFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector,
        ExecutionOptions options
    );
    event ScopeRevokeFunction(
        uint16 role,
        address targetAddress,
        bytes4 selector
    );
    event ScopeFunction(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        bool[] paramIsScoped,
        ParameterType[] paramType,
        Comparison[] paramComp,
        bytes[] compValue,
        ExecutionOptions options
    );
    event ScopeFunctionExecutionOptions(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        ExecutionOptions options
    );
    event ScopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        ParameterType paramType,
        Comparison paramComp,
        bytes compValue
    );
    event ScopeParameterAsOneOf(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        ParameterType paramType,
        bytes[] compValues
    );
    event UnscopeParameter(
        uint16 role,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex
    );

    /// Sender is not a member of the role
    error NoMembership();

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

    /// CompValue for static types should have a size of exactly 32 bytes
    error UnsuitableStaticCompValueSize();

    /// CompValue for Dynamic32 types should be a multiple of exactly 32 bytes
    error UnsuitableDynamic32CompValueSize();

    /// Exceeds the max number of params supported
    error ScopeMaxParametersExceeded();

    /*
     *
     * CHECKERS
     *
     */

    function check(
        Role storage role,
        address multisend,
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) public view {
        if (!role.members[msg.sender]) {
            revert NoMembership();
        }
        if (multisend == to) {
            checkMultisendTransaction(role, data);
        } else {
            checkTransaction(role, to, value, data, operation);
        }
    }

    /// @dev Splits a multisend data blob into transactions and forwards them to be checked.
    /// @param data the packed transaction data (created by utils function buildMultiSendSafeTx).
    /// @param role Role to check for.
    function checkMultisendTransaction(Role storage role, bytes memory data)
        internal
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
    ) internal view {
        if (data.length != 0 && data.length < 4) {
            revert FunctionSignatureTooShort();
        }

        TargetAddress storage target = role.targets[targetAddress];
        if (target.clearance == Clearance.NONE) {
            revert TargetAddressNotAllowed();
        }

        if (target.clearance == Clearance.TARGET) {
            checkExecutionOptions(target.options, value, operation);
            return;
        }

        if (target.clearance == Clearance.FUNCTION) {
            uint256 scopeConfig = role.functions[
                keyForFunctions(targetAddress, bytes4(data))
            ];

            if (scopeConfig == 0) {
                revert FunctionNotAllowed();
            }

            (ExecutionOptions options, bool isWildcarded, ) = unpackFunction(
                scopeConfig
            );

            checkExecutionOptions(options, value, operation);

            if (isWildcarded == false) {
                checkParameters(role, scopeConfig, targetAddress, data);
            }
            return;
        }

        assert(false);
    }

    function checkExecutionOptions(
        ExecutionOptions options,
        uint256 value,
        Enum.Operation operation
    ) internal pure {
        bool isSend = value > 0;
        bool isDelegateCall = operation == Enum.Operation.DelegateCall;

        bool canSend = options == ExecutionOptions.SEND ||
            options == ExecutionOptions.BOTH;
        bool canDelegateCall = options == ExecutionOptions.DELEGATECALL ||
            options == ExecutionOptions.BOTH;

        if (isSend && !canSend) {
            revert SendNotAllowed();
        }

        if (isDelegateCall && !canDelegateCall) {
            revert DelegateCallNotAllowed();
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
    ) internal view {
        bytes4 functionSig = bytes4(data);
        (, , uint8 paramCount) = unpackFunction(scopeConfig);

        for (uint8 i = 0; i < paramCount; i++) {
            (
                bool isParamScoped,
                ParameterType paramType,
                Comparison compType
            ) = unpackParameter(scopeConfig, i);

            if (!isParamScoped) {
                continue;
            }

            bytes32 value;
            if (paramType != ParameterType.STATIC) {
                value = pluckDynamicParamValue(data, paramType, i);
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

    function allowTarget(
        Role storage role,
        uint16 roleId,
        address targetAddress,
        ExecutionOptions options
    ) external {
        role.targets[targetAddress] = TargetAddress(Clearance.TARGET, options);
        emit AllowTarget(roleId, targetAddress, options);
    }

    function allowTargetPartially(
        Role storage role,
        uint16 roleId,
        address targetAddress
    ) external {
        role.targets[targetAddress] = TargetAddress(
            Clearance.FUNCTION,
            ExecutionOptions(0)
        );
        emit AllowTargetPartially(roleId, targetAddress);
    }

    function revokeTarget(
        Role storage role,
        uint16 roleId,
        address targetAddress
    ) external {
        role.targets[targetAddress] = TargetAddress(
            Clearance.NONE,
            ExecutionOptions(0)
        );
        emit RevokeTarget(roleId, targetAddress);
    }

    function scopeAllowFunction(
        Role storage role,
        uint16 roleId,
        address targetAddress,
        bytes4 functionSig,
        ExecutionOptions options
    ) external {
        role.functions[
            keyForFunctions(targetAddress, functionSig)
        ] = packFunction(0, options, true, 0);
        emit ScopeAllowFunction(roleId, targetAddress, functionSig, options);
    }

    function scopeRevokeFunction(
        Role storage role,
        uint16 roleId,
        address targetAddress,
        bytes4 functionSig
    ) external {
        role.functions[keyForFunctions(targetAddress, functionSig)] = 0;
        emit ScopeRevokeFunction(roleId, targetAddress, functionSig);
    }

    function scopeFunction(
        Role storage role,
        uint16 roleId,
        address targetAddress,
        bytes4 functionSig,
        bool[] memory paramIsScoped,
        ParameterType[] memory paramType,
        Comparison[] memory paramComp,
        bytes[] calldata compValue,
        ExecutionOptions options
    ) external {
        if (
            paramIsScoped.length != paramType.length ||
            paramIsScoped.length != paramComp.length ||
            paramIsScoped.length != compValue.length
        ) {
            revert ArraysDifferentLength();
        }

        if (paramIsScoped.length > SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        for (uint256 i = 0; i < paramType.length; i++) {
            if (paramIsScoped[i]) {
                enforceComp(paramType[i], paramComp[i]);
                enforceCompValue(paramType[i], compValue[i]);
            }
        }

        uint256 scopeConfig = scopeConfigCreate(
            options,
            paramIsScoped,
            paramType,
            paramComp
        );

        //set scopeConfig
        role.functions[
            keyForFunctions(targetAddress, functionSig)
        ] = scopeConfig;

        //set compValues
        for (uint8 i = 0; i < paramComp.length; i++) {
            role.compValues[
                keyForCompValues(targetAddress, functionSig, i)
            ] = compressCompValue(paramType[i], compValue[i]);
        }
        emit ScopeFunction(
            roleId,
            targetAddress,
            functionSig,
            paramIsScoped,
            paramType,
            paramComp,
            compValue,
            options
        );
    }

    function scopeFunctionExecutionOptions(
        Role storage role,
        uint16 roleId,
        address targetAddress,
        bytes4 functionSig,
        ExecutionOptions options
    ) external {
        bytes32 key = keyForFunctions(targetAddress, functionSig);
        uint256 scopeConfig = role.functions[key];
        (, bool isWildcarded, uint8 paramCount) = unpackFunction(scopeConfig);

        //set scopeConfig
        role.functions[
            keyForFunctions(targetAddress, functionSig)
        ] = packFunction(scopeConfig, options, isWildcarded, paramCount);

        emit ScopeFunctionExecutionOptions(
            roleId,
            targetAddress,
            functionSig,
            options
        );
    }

    function scopeParameter(
        Role storage role,
        uint16 roleId,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        ParameterType paramType,
        Comparison paramComp,
        bytes calldata compValue
    ) external {
        if (paramIndex >= SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        enforceComp(paramType, paramComp);
        enforceCompValue(paramType, compValue);

        // set scopeConfig
        bytes32 key = keyForFunctions(targetAddress, functionSig);
        uint256 scopeConfig = scopeConfigSet(
            role.functions[key],
            paramIndex,
            true,
            paramType,
            paramComp
        );
        role.functions[key] = scopeConfig;

        // set compValue
        role.compValues[
            keyForCompValues(targetAddress, functionSig, paramIndex)
        ] = compressCompValue(paramType, compValue);

        emit ScopeParameter(
            roleId,
            targetAddress,
            functionSig,
            paramIndex,
            paramType,
            paramComp,
            compValue
        );
    }

    function scopeParameterAsOneOf(
        Role storage role,
        uint16 roleId,
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex,
        ParameterType paramType,
        bytes[] calldata compValues
    ) external {
        if (paramIndex >= SCOPE_MAX_PARAMS) {
            revert ScopeMaxParametersExceeded();
        }

        for (uint256 i = 0; i < compValues.length; i++) {
            enforceCompValue(paramType, compValues[i]);
        }

        // set scopeConfig
        bytes32 key = keyForFunctions(targetAddress, functionSig);
        uint256 scopeConfig = scopeConfigSet(
            role.functions[key],
            paramIndex,
            true,
            paramType,
            Comparison.OneOf
        );
        role.functions[key] = scopeConfig;

        // set compValue
        key = keyForCompValues(targetAddress, functionSig, paramIndex);
        role.compValuesOneOf[key] = new bytes32[](compValues.length);
        for (uint256 i = 0; i < compValues.length; i++) {
            role.compValuesOneOf[key][i] = compressCompValue(
                paramType,
                compValues[i]
            );
        }

        emit ScopeParameterAsOneOf(
            roleId,
            targetAddress,
            functionSig,
            paramIndex,
            paramType,
            compValues
        );
    }

    function unscopeParameter(
        Role storage role,
        uint16 roleId,
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
            ParameterType(0),
            Comparison(0)
        );
        role.functions[key] = scopeConfig;

        emit UnscopeParameter(roleId, targetAddress, functionSig, paramIndex);
    }

    function enforceComp(ParameterType paramType, Comparison paramComp)
        internal
        pure
    {
        if (paramComp == Comparison.OneOf) {
            revert UnsuitableOneOfComparison();
        }

        if (
            (paramType != ParameterType.STATIC) &&
            (paramComp != Comparison.EqualTo)
        ) {
            revert UnsuitableRelativeComparison();
        }
    }

    function enforceCompValue(ParameterType paramType, bytes calldata compValue)
        internal
        pure
    {
        if (paramType == ParameterType.STATIC && compValue.length != 32) {
            revert UnsuitableStaticCompValueSize();
        }

        if (
            paramType == ParameterType.DYNAMIC32 && compValue.length % 32 != 0
        ) {
            revert UnsuitableDynamic32CompValueSize();
        }
    }

    /*
     *
     * HELPERS
     *
     */
    function pluckDynamicParamValue(
        bytes memory data,
        ParameterType paramType,
        uint256 paramIndex
    ) internal pure returns (bytes32) {
        assert(paramType != ParameterType.STATIC);

        /*
         * Encoded calldata:
         * 32 bytes -> length in bytes of the entire buffer
         * 4  bytes -> function selector
         * 32 bytes -> sequence, one chunk per parameter
         *
         * There is one (byte32) chunk per paremeter. Depending on type it contains:
         * Static    -> value encoded inline (not plucked by this function)
         * Dynamic   -> a byte offset to encoded data payload
         * Dynamic32 -> a byte offset to encoded data payload
         * Note: Fixed Sized Arrays (e.g., bool[2]), are encoded inline (in the "chunks")
         * Note: Nested types also do not follow the above described rules, and are unsupported
         * Note: The offset to encoded data payload is relative, (minus 32 bytes that include overall buffer length and 4 bytes for functionSig)
         *
         * Names:
         * offsetPointer -> The offset to the initial 32 byte chunks (one per Parameter)
         * offsetPayload -> The offset to the encoded parameter payload
         *
         * At encoded payload, the first 32 bytes contain the payload's length. Depending on ParameterType:
         * Dynamic   -> length in bytes
         * Dynamic32 -> length in bytes32
         * Note: Dynamic types are: bytes, string
         * Note: Dynamic32 types are all non-nested arrays: address[] bytes32[] uint[] etc
         */

        uint256 offsetPointer = 32 + 4 + paramIndex * 32;
        uint256 offsetPayload;
        assembly {
            offsetPayload := mload(add(data, offsetPointer))
            // this offset is relative: must adjust for overral buffer lenthg and functionSig
            offsetPayload := add(32, add(4, offsetPayload))
        }

        uint256 lengthPayload;
        assembly {
            lengthPayload := mload(add(data, offsetPayload))
        }

        /*
         * above, the function uses memory byte offset
         * bellow, slice will use array byte offset
         * Therefore the start in array byte index for slice is:
         * offsetPayload - 32 + 32
         *      (-32 overall buffer length chunk)
         *      (+32 encoded payload length chunk)
         *
         */
        uint256 start = offsetPayload;
        uint256 end = start +
            (
                paramType == ParameterType.DYNAMIC32
                    ? lengthPayload * 32
                    : lengthPayload
            );

        return keccak256(slice(data, start, end));
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
        ExecutionOptions options,
        bool[] memory isParamScoped,
        ParameterType[] memory paramType,
        Comparison[] memory paramComp
    ) internal pure returns (uint256) {
        uint8 paramCount = uint8(isParamScoped.length);
        //pack -> options, isWildcarded, Lengh
        uint256 scopeConfig = packFunction(0, options, false, paramCount);
        for (uint8 i = 0; i < paramCount; i++) {
            scopeConfig = packParameter(
                scopeConfig,
                i,
                isParamScoped[i],
                paramType[i],
                paramComp[i]
            );
        }

        return scopeConfig;
    }

    function scopeConfigSet(
        uint256 scopeConfig,
        uint8 paramIndex,
        bool isScoped,
        ParameterType paramType,
        Comparison paramComp
    ) internal pure returns (uint256) {
        (ExecutionOptions options, , uint8 prevParamCount) = unpackFunction(
            scopeConfig
        );

        uint8 nextParamCount = paramIndex + 1 > prevParamCount
            ? paramIndex + 1
            : prevParamCount;

        return
            packFunction(
                packParameter(
                    scopeConfig,
                    paramIndex,
                    isScoped,
                    paramType,
                    paramComp
                ),
                options,
                // isWildcarded=false
                false,
                nextParamCount
            );
    }

    /*
     * pack/unpack are bit helpers for scopeConfig
     */
    function packFunction(
        uint256 scopeConfig,
        ExecutionOptions options,
        bool isWildcarded,
        uint8 paramCount
    ) internal pure returns (uint256) {
        // 2   bits -> options
        // 1   bits -> isWildcarded
        // 5   bits -> unused
        // 8   bits -> length
        // 48  bits -> isParamScoped
        // 96  bits -> paramType (2 bits per entry 48*2)
        // 96  bits -> paramComp (2 bits per entry 48*2)

        // wipe the left clean, and start from there
        scopeConfig = (scopeConfig << 16) >> 16;

        // set options -> 256 - 2 = 254
        scopeConfig |= uint256(options) << 254;

        // set isWildcarded -> 256 - 2 - 1 = 253
        uint256 isWildcardedMask = 1 << 253;
        if (isWildcarded) {
            scopeConfig |= isWildcardedMask;
        } else {
            scopeConfig &= ~isWildcardedMask;
        }

        // set Length -> 48 + 96 + 96 = 240
        scopeConfig |= uint256(paramCount) << 240;

        return scopeConfig;
    }

    function packParameter(
        uint256 scopeConfig,
        uint8 paramIndex,
        bool isScoped,
        ParameterType paramType,
        Comparison paramComp
    ) internal pure returns (uint256) {
        // 2   bits -> options
        // 1   bits -> isWildcarded
        // 5   bits -> unused
        // 8   bits -> length
        // 48  bits -> isParamScoped
        // 96  bits -> paramType (2 bits per entry 48*2)
        // 96  bits -> paramComp (2 bits per entry 48*2)
        uint256 isScopedMask = 1 << (paramIndex + 96 + 96);
        uint256 paramTypeMask = 3 << (paramIndex * 2 + 96);
        uint256 paramCompMask = 3 << (paramIndex * 2);

        if (isScoped) {
            scopeConfig |= isScopedMask;
        } else {
            scopeConfig &= ~isScopedMask;
        }

        scopeConfig &= ~paramTypeMask;
        scopeConfig |= uint256(paramType) << (paramIndex * 2 + 96);

        scopeConfig &= ~paramCompMask;
        scopeConfig |= uint256(paramComp) << (paramIndex * 2);

        return scopeConfig;
    }

    function unpackFunction(uint256 scopeConfig)
        internal
        pure
        returns (
            ExecutionOptions options,
            bool isWildcarded,
            uint8 paramCount
        )
    {
        uint256 isWildcardedMask = 1 << 253;

        options = ExecutionOptions(scopeConfig >> 254);
        isWildcarded = scopeConfig & isWildcardedMask != 0;
        paramCount = uint8((scopeConfig << 8) >> 248);
    }

    function unpackParameter(uint256 scopeConfig, uint8 paramIndex)
        internal
        pure
        returns (
            bool isScoped,
            ParameterType paramType,
            Comparison paramComp
        )
    {
        uint256 isScopedMask = 1 << (paramIndex + 96 + 96);
        uint256 paramTypeMask = 3 << (paramIndex * 2 + 96);
        uint256 paramCompMask = 3 << (paramIndex * 2);

        isScoped = (scopeConfig & isScopedMask) != 0;
        paramType = ParameterType(
            (scopeConfig & paramTypeMask) >> (paramIndex * 2 + 96)
        );
        paramComp = Comparison(
            (scopeConfig & paramCompMask) >> (paramIndex * 2)
        );
    }

    function keyForFunctions(address targetAddress, bytes4 functionSig)
        public
        pure
        returns (bytes32)
    {
        return bytes32(abi.encodePacked(targetAddress, functionSig));
    }

    function keyForCompValues(
        address targetAddress,
        bytes4 functionSig,
        uint8 paramIndex
    ) public pure returns (bytes32) {
        return
            bytes32(abi.encodePacked(targetAddress, functionSig, paramIndex));
    }

    function compressCompValue(
        ParameterType paramType,
        bytes calldata compValue
    ) internal pure returns (bytes32) {
        return
            paramType == ParameterType.STATIC
                ? bytes32(compValue)
                : keccak256(compValue);
    }
}
