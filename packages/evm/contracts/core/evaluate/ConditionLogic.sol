// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./BitmaskChecker.sol";
import "./CustomConditionChecker.sol";
import "./WithinAllowanceChecker.sol";
import "./WithinRatioChecker.sol";

import "../../common/AbiLocation.sol";

import "../../types/Types.sol";

/**
 * @title ConditionLogic
 * @notice Evaluates condition trees on scoped function calls.
 * @author gnosisguild
 */
library ConditionLogic {
    function evaluate(
        bytes calldata data,
        uint256 location,
        Condition memory condition,
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
                    _matches(data, location, condition, consumptions, context);
            } else if (operator == Operator.And) {
                return _and(data, location, condition, consumptions, context);
            } else if (operator == Operator.Or) {
                return _or(data, location, condition, consumptions, context);
            } else if (operator == Operator.Slice) {
                return _slice(data, location, condition, consumptions, context);
            } else if (operator == Operator.Pluck) {
                (bytes32 pluckedValue, bool overflow) = __input(
                    data,
                    location,
                    condition,
                    context
                );
                if (overflow) {
                    return
                        _violation(
                            Status.CalldataOverflow,
                            location,
                            condition
                        );
                }
                context.pluckedValues[
                    uint8(condition.compValue[0])
                ] = pluckedValue;
                return _ok(consumptions);
            } else if (operator == Operator.Empty) {
                return
                    _result(
                        data.length == 0 ? Status.Ok : Status.CalldataNotEmpty,
                        0,
                        condition,
                        consumptions
                    );
            } else if (operator == Operator.ArraySome) {
                return
                    _arraySome(
                        data,
                        location,
                        condition,
                        consumptions,
                        context
                    );
            } else if (operator == Operator.ArrayEvery) {
                return
                    _arrayEvery(
                        data,
                        location,
                        condition,
                        consumptions,
                        context
                    );
            } else {
                assert(operator == Operator.ArrayTailMatches);
                return
                    _arrayTailMatches(
                        data,
                        location,
                        condition,
                        consumptions,
                        context
                    );
            }
        } else {
            if (operator <= Operator.LessThan) {
                return
                    _result(
                        _compare(data, location, condition, context),
                        location,
                        condition,
                        consumptions
                    );
            } else if (operator <= Operator.SignedIntLessThan) {
                return
                    _result(
                        _compareSignedInt(data, location, condition, context),
                        location,
                        condition,
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
                        location,
                        condition,
                        consumptions
                    );
            } else if (operator == Operator.WithinAllowance) {
                (bytes32 allowanceValue, bool overflow) = __input(
                    data,
                    location,
                    condition,
                    context
                );
                if (overflow) {
                    return
                        _violation(
                            Status.CalldataOverflow,
                            location,
                            condition
                        );
                }
                return
                    __allowance(
                        uint256(allowanceValue),
                        location,
                        condition,
                        consumptions
                    );
            } else if (operator == Operator.CallWithinAllowance) {
                return __allowance(1, location, condition, consumptions);
            } else if (operator == Operator.WithinRatio) {
                // WithinRatio uses plucked values, not a direct payload location
                return
                    _result(
                        WithinRatioChecker.check(
                            condition.compValue,
                            context.pluckedValues
                        ),
                        0,
                        condition,
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
                        location,
                        condition,
                        consumptions
                    );
            }
        }
    }

    function _matches(
        bytes calldata data,
        uint256 location,
        Condition memory condition,
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

            // Check bounds before reading leading bytes
            if (location + (32 - shift) > data.length) {
                return _violation(Status.CalldataOverflow, location, condition);
            }

            bytes32 expected = bytes32(condition.compValue) >> shift;
            bytes32 actual = bytes32(data[location:]) >> shift;

            if (expected != actual) {
                return
                    _violation(
                        Status.LeadingBytesNotAMatch,
                        location,
                        condition
                    );
            }
        }

        // Decode children locations - all children are structural
        (uint256[] memory childLocations, bool overflow) = AbiLocation.children(
            data,
            location + condition.leadingBytes,
            condition
        );

        if (overflow) {
            return _violation(Status.CalldataOverflow, location, condition);
        }

        if (condition.children.length != childLocations.length) {
            return _violation(Status.ParameterNotAMatch, location, condition);
        }

        result.consumptions = consumptions;
        for (uint256 i; i < childLocations.length; ++i) {
            result = evaluate(
                data,
                childLocations[i],
                condition.children[i],
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
        uint256 location,
        Condition memory condition,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = consumptions;
        for (uint256 i; i < condition.children.length; ++i) {
            result = evaluate(
                data,
                location,
                condition.children[i],
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
        uint256 location,
        Condition memory condition,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        for (uint256 i; i < condition.children.length; ++i) {
            result = evaluate(
                data,
                location,
                condition.children[i],
                consumptions,
                context
            );
            if (result.status == Status.Ok) {
                return result;
            }
        }

        return _violation(Status.OrViolation, location, condition);
    }

    function _arraySome(
        bytes calldata data,
        uint256 location,
        Condition memory condition,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        // Decode array element locations
        (uint256[] memory childLocations, bool overflow) = AbiLocation.children(
            data,
            location,
            condition
        );

        if (overflow) {
            return _violation(Status.CalldataOverflow, location, condition);
        }

        for (uint256 i; i < childLocations.length; ++i) {
            result = evaluate(
                data,
                childLocations[i],
                condition.children[0],
                consumptions,
                context
            );

            if (result.status == Status.Ok) {
                return result;
            }
        }

        return _violation(Status.NoArrayElementPasses, location, condition);
    }

    function _arrayEvery(
        bytes calldata data,
        uint256 location,
        Condition memory condition,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        // Decode array element locations
        (uint256[] memory childLocations, bool overflow) = AbiLocation.children(
            data,
            location,
            condition
        );

        if (overflow) {
            return _violation(Status.CalldataOverflow, location, condition);
        }

        result.consumptions = consumptions;
        for (uint256 i; i < childLocations.length; ++i) {
            result = evaluate(
                data,
                childLocations[i],
                condition.children[0],
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
        uint256 location,
        Condition memory condition,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        // Decode array element locations
        (uint256[] memory childLocations, bool overflow) = AbiLocation.children(
            data,
            location,
            condition
        );

        if (overflow) {
            return _violation(Status.CalldataOverflow, location, condition);
        }

        uint256 conditionCount = condition.children.length;
        uint256 childCount = childLocations.length;

        if (childCount < conditionCount) {
            return _violation(Status.ParameterNotAMatch, location, condition);
        }

        result.consumptions = consumptions;
        uint256 tailOffset = childCount - conditionCount;

        for (uint256 i; i < conditionCount; ++i) {
            result = evaluate(
                data,
                childLocations[tailOffset + i],
                condition.children[i],
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
        uint256 location,
        Condition memory condition,
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

        return evaluate(data, childLocation, sliced, consumptions, context);
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
        (bytes32 value, bool overflow) = __input(
            data,
            location,
            condition,
            context
        );
        if (overflow) return Status.CalldataOverflow;

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
        (bytes32 rawValue, bool overflow) = __input(
            data,
            location,
            condition,
            context
        );
        if (overflow) return Status.CalldataOverflow;

        int256 value = int256(uint256(rawValue));

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
        uint256 location,
        Condition memory condition,
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

        return _result(status, location, condition, nextConsumptions);
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
    ) private pure returns (bytes32 result, bool overflow) {
        /*
         * Integrity rules map Encoding.EtherValue -> Encoding.None during packing.
         * If we encounter Encoding.None here (in a comparison context), it acts as
         * a virtual static parameter representing the transaction value.
         */
        if (condition.encoding == Encoding.None) {
            return (bytes32(context.value), false);
        }

        // Check if condition has size set (e.g., from Slice), otherwise get from decoder
        uint256 size;
        if (condition.size != 0) {
            size = condition.size;
        } else {
            (size, overflow) = AbiLocation.size(data, location, condition);
            if (overflow) return (0, true);
        }

        if (location + size > data.length) {
            return (0, true);
        }

        if (size == 32) {
            assembly {
                result := calldataload(add(data.offset, location))
            }
            return (result, false);
        }

        // align the word for slicing
        if (size < 32) {
            return (
                bytes32(data[location:location + size]) >> ((32 - size) * 8),
                false
            );
        }

        // size > 32
        return (keccak256(data[location:location + size]), false);
    }

    function _result(
        Status status,
        uint256 location,
        Condition memory condition,
        Consumption[] memory consumptions
    ) private pure returns (Result memory) {
        return
            status == Status.Ok
                ? _ok(consumptions)
                : _violation(status, location, condition);
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
        uint256 location,
        Condition memory condition
    ) private pure returns (Result memory) {
        Consumption[] memory empty;
        return
            Result({
                status: status,
                violatedNodeIndex: condition.index,
                payloadLocation: location,
                consumptions: empty
            });
    }
}
