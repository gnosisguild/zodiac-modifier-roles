// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./BitmaskChecker.sol";
import "./CustomConditionChecker.sol";
import "./WithinAllowanceChecker.sol";
import "./WithinRatioChecker.sol";

import "../../common/AbiLocator.sol";

import "../../types/Types.sol";

/**
 * @title ConditionLogic
 * @notice Evaluates condition trees on scoped function calls.
 * @author gnosisguild
 */
library ConditionLogic {
    function evaluate(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) internal view returns (Result memory) {
        Operator operator = condition.operator;

        if (operator < Operator.EqualTo) {
            if (operator == Operator.Pass) {
                return _ok(consumptions);
            } else if (operator == Operator.Matches) {
                location = location > 0 &&
                    condition.encoding == Encoding.AbiEncoded
                    ? location + 32
                    : location;
                return
                    _matches(data, condition, location, consumptions, context);
            } else if (operator == Operator.And) {
                return _and(data, condition, location, consumptions, context);
            } else if (operator == Operator.Or) {
                return _or(data, condition, location, consumptions, context);
            } else if (operator == Operator.Slice) {
                return _slice(data, condition, location, consumptions, context);
            } else if (operator == Operator.Pluck) {
                context.pluckedValues[uint8(condition.compValue[0])] = __input(
                    data,
                    location,
                    condition,
                    context
                );
                return _ok(consumptions);
            } else if (operator == Operator.Empty) {
                return
                    _result(
                        data.length == 0 ? Status.Ok : Status.CalldataNotEmpty,
                        condition,
                        0,
                        consumptions
                    );
            } else if (operator == Operator.ArraySome) {
                return
                    _arraySome(
                        data,
                        condition,
                        location,
                        consumptions,
                        context
                    );
            } else if (operator == Operator.ArrayEvery) {
                return
                    _arrayEvery(
                        data,
                        condition,
                        location,
                        consumptions,
                        context
                    );
            } else {
                assert(operator == Operator.ArrayTailMatches);
                return
                    _arrayTailMatches(
                        data,
                        condition,
                        location,
                        consumptions,
                        context
                    );
            }
        } else {
            if (operator <= Operator.LessThan) {
                return
                    _result(
                        _compare(data, location, condition, context),
                        condition,
                        location,
                        consumptions
                    );
            } else if (operator <= Operator.SignedIntLessThan) {
                return
                    _result(
                        _compareSignedInt(data, location, condition, context),
                        condition,
                        location,
                        consumptions
                    );
            } else if (operator == Operator.Bitmask) {
                return
                    _result(
                        BitmaskChecker.check(
                            data,
                            location,
                            condition.compValue,
                            condition.inlined
                        ),
                        condition,
                        location,
                        consumptions
                    );
            } else if (operator == Operator.WithinAllowance) {
                return
                    __allowance(
                        uint256(__input(data, location, condition, context)),
                        condition,
                        location,
                        consumptions
                    );
            } else if (operator == Operator.CallWithinAllowance) {
                return __allowance(1, condition, location, consumptions);
            } else if (operator == Operator.WithinRatio) {
                // WithinRatio uses plucked values, not a direct payload location
                return
                    _result(
                        WithinRatioChecker.check(
                            condition.compValue,
                            context.pluckedValues
                        ),
                        condition,
                        0,
                        consumptions
                    );
            } else {
                assert(operator == Operator.Custom);
                return
                    _result(
                        CustomConditionChecker.check(
                            condition.compValue,
                            context.to,
                            context.value,
                            data,
                            context.operation,
                            location,
                            condition,
                            context.pluckedValues
                        ),
                        condition,
                        location,
                        consumptions
                    );
            }
        }
    }

    function _matches(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        uint256 shift = 32 - condition.compValue.length;
        if (shift < 32) {
            /*
             * Leading Bytes Validation
             *
             * For AbiEncoded + Matches, compValue might contain N bytes that must
             * match the first N bytes of calldata at location.
             *
             * Integrity.sol validates N <= 32, so shift underflow is impossible.
             *
             * Comparison uses right-alignment in bytes32:
             *   shift = 32 - N
             *   expected: bytes32(compValue)  >> shift  (N bytes, right-aligned)
             *   actual:   bytes32(data[loc:]) >> shift  (N bytes, right-aligned)
             *
             * If compValue is empty (shift == 32), validation is skipped.
             */

            bytes32 expected = bytes32(condition.compValue) >> shift;
            bytes32 actual = bytes32(data[location:]) >> shift;

            if (expected != actual) {
                return
                    _violation(
                        Status.LeadingBytesNotAMatch,
                        condition,
                        location,
                        consumptions
                    );
            }
        }

        // Decode children locations - all children are structural
        uint256[] memory childLocations = AbiLocator.getChildLocations(
            data,
            location + condition.leadingBytes,
            condition
        );

        result.consumptions = consumptions;
        for (uint256 i; i < childLocations.length; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                childLocations[i],
                result.consumptions,
                context
            );
            if (result.status != Status.Ok) {
                return result;
            }
        }
        return result;
    }

    function _and(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = consumptions;
        for (uint256 i; i < condition.children.length; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                location,
                result.consumptions,
                context
            );
            if (result.status != Status.Ok) {
                return result;
            }
        }
        return result;
    }

    function _or(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        for (uint256 i; i < condition.children.length; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                location,
                consumptions,
                context
            );
            if (result.status == Status.Ok) {
                return result;
            }
        }

        return
            _violation(Status.OrViolation, condition, location, consumptions);
    }

    function _arraySome(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        // Decode array element locations
        uint256[] memory childLocations = AbiLocator.getChildLocations(
            data,
            location,
            condition
        );

        for (uint256 i; i < childLocations.length; ++i) {
            result = evaluate(
                data,
                condition.children[0],
                childLocations[i],
                consumptions,
                context
            );

            if (result.status == Status.Ok) {
                return result;
            }
        }

        return
            _violation(
                Status.NoArrayElementPasses,
                condition,
                location,
                consumptions
            );
    }

    function _arrayEvery(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        // Decode array element locations
        uint256[] memory childLocations = AbiLocator.getChildLocations(
            data,
            location,
            condition
        );

        result.consumptions = consumptions;
        for (uint256 i; i < childLocations.length; ++i) {
            result = evaluate(
                data,
                condition.children[0],
                childLocations[i],
                result.consumptions,
                context
            );

            if (result.status != Status.Ok) {
                result.status = Status.NotEveryArrayElementPasses;
                return result;
            }
        }
        return result;
    }

    function _arrayTailMatches(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        // Decode array element locations
        uint256[] memory childLocations = AbiLocator.getChildLocations(
            data,
            location,
            condition
        );

        uint256 conditionCount = condition.children.length;
        uint256 childCount = childLocations.length;

        if (childCount < conditionCount) {
            return
                _violation(
                    Status.ParameterNotAMatch,
                    condition,
                    location,
                    consumptions
                );
        }

        result.consumptions = consumptions;
        uint256 tailOffset = childCount - conditionCount;

        for (uint256 i; i < conditionCount; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                childLocations[tailOffset + i],
                result.consumptions,
                context
            );

            if (result.status != Status.Ok) {
                return result;
            }
        }
        return result;
    }

    /*
     * Slice computes a new location pointing to a byte-range within the
     * current location, so the child transparently evaluates against that
     * slice.
     *
     * The child will read the slice via __input, which right-aligns values
     * <=32 bytes to match comparison compValue encoding.
     */
    function _slice(
        bytes calldata data,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        // compValue layout: | 2 bytes: shift | 1 byte: size (1-32)
        uint16 shift = uint16(bytes2(condition.compValue));
        uint8 size = uint8(condition.compValue[2]);

        // Compute sliced location
        uint256 childLocation = location + (condition.inlined ? 0 : 32) + shift;

        Condition memory child = condition.children[0];
        Condition memory sliced;

        assembly {
            // Shallow copy child condition
            sliced := mload(0x40)

            mstore(0x40, add(sliced, 0x100))
            mcopy(sliced, child, 0x100)
        }
        sliced.size = size;

        return evaluate(data, sliced, childLocation, consumptions, context);
    }

    function _compare(
        bytes calldata data,
        uint256 location,
        Condition memory condition,
        Context memory context
    ) private pure returns (Status) {
        Operator operator = condition.operator;

        bytes32 compValue = condition.compValue.length > 32
            ? keccak256(condition.compValue)
            : bytes32(condition.compValue);
        bytes32 value = __input(data, location, condition, context);

        if (operator == Operator.EqualTo && value != compValue) {
            return Status.ParameterNotAllowed;
        } else if (operator == Operator.GreaterThan && value <= compValue) {
            return Status.ParameterLessThanAllowed;
        } else if (operator == Operator.LessThan && value >= compValue) {
            return Status.ParameterGreaterThanAllowed;
        } else {
            return Status.Ok;
        }
    }

    function _compareSignedInt(
        bytes calldata data,
        uint256 location,
        Condition memory condition,
        Context memory context
    ) private pure returns (Status) {
        Operator operator = condition.operator;
        int256 compValue = int256(uint256(bytes32(condition.compValue)));
        int256 value = int256(
            uint256(__input(data, location, condition, context))
        );

        if (operator == Operator.SignedIntGreaterThan && value <= compValue) {
            return Status.ParameterLessThanAllowed;
        } else if (
            operator == Operator.SignedIntLessThan && value >= compValue
        ) {
            return Status.ParameterGreaterThanAllowed;
        } else {
            return Status.Ok;
        }
    }

    function __allowance(
        uint256 value,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions
    ) private view returns (Result memory) {
        (
            Status status,
            Consumption[] memory nextConsumptions
        ) = WithinAllowanceChecker.check(
                consumptions,
                value,
                condition.compValue
            );

        return _result(status, condition, location, nextConsumptions);
    }

    /**
     * @dev Reads a value from calldata or from Transaction.value, right-aligning when needed.
     *      - Encoding.None: returns context.value (ether amount)
     *      - size <= 32: reads from calldata and right-aligns
     *      - size > 32: returns keccak256 hash of the calldata slice
     *
     * @param data      The calldata to read from.
     * @param location  The location in calldata.
     * @param condition The condition with layout info.
     * @param context   The execution context (for ether value).
     * @return result   The value as bytes32, right-aligned or hashed.
     */
    function __input(
        bytes calldata data,
        uint256 location,
        Condition memory condition,
        Context memory context
    ) private pure returns (bytes32 result) {
        /*
         * Integrity rules map Encoding.EtherValue -> Encoding.None during packing.
         * If we encounter Encoding.None here (in a comparison context), it acts as
         * a virtual static parameter representing the transaction value.
         */
        if (condition.encoding == Encoding.None) {
            return bytes32(context.value);
        }

        // Check if condition has size set (e.g., from Slice), otherwise get from decoder
        uint256 size = condition.size != 0
            ? condition.size
            : AbiLocator.getSize(data, location, condition);

        // Clamp size to available data (handles bounds)
        if (location < data.length) {
            uint256 available = data.length - location;
            if (size > available) {
                size = available;
            }
        } else {
            size = 0;
        }

        if (size == 32) {
            assembly {
                result := calldataload(add(data.offset, location))
            }
            return result;
        }

        if (size < 32 && size > 0) {
            // Right-align - read exactly 'size' bytes
            return bytes32(data[location:location + size]) >> ((32 - size) * 8);
        }

        if (size > 32) {
            return keccak256(data[location:location + size]);
        }

        return bytes32(0);
    }

    function _result(
        Status status,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions
    ) private pure returns (Result memory) {
        return
            status == Status.Ok
                ? _ok(consumptions)
                : _violation(status, condition, location, consumptions);
    }

    function _ok(
        Consumption[] memory consumptions
    ) private pure returns (Result memory) {
        return
            Result({
                status: Status.Ok,
                violatedNodeIndex: 0,
                payloadLocation: 0,
                consumptions: consumptions
            });
    }

    function _violation(
        Status status,
        Condition memory condition,
        uint256 location,
        Consumption[] memory consumptions
    ) private pure returns (Result memory) {
        return
            Result({
                status: status,
                violatedNodeIndex: condition.index,
                payloadLocation: location,
                consumptions: consumptions
            });
    }
}
