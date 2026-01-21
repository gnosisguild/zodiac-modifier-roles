// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./BitmaskChecker.sol";
import "./CustomConditionChecker.sol";
import "./WithinAllowanceChecker.sol";
import "./WithinRatioChecker.sol";

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
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) internal view returns (Result memory) {
        if (payload.overflow) {
            return
                _violation(
                    Status.CalldataOverflow,
                    condition,
                    payload,
                    consumptions
                );
        }

        Operator operator = condition.operator;

        if (operator < Operator.EqualTo) {
            if (operator == Operator.Pass) {
                return _ok(consumptions);
            } else if (operator == Operator.Matches) {
                return
                    _matches(data, condition, payload, consumptions, context);
            } else if (operator == Operator.And) {
                return _and(data, condition, payload, consumptions, context);
            } else if (operator == Operator.Or) {
                return _or(data, condition, payload, consumptions, context);
            } else if (operator == Operator.Slice) {
                return _slice(data, condition, payload, consumptions, context);
            } else if (operator == Operator.Pluck) {
                context.pluckedValues[uint8(condition.compValue[0])] = __input(
                    data,
                    payload,
                    context
                );
                return _ok(consumptions);
            } else if (operator == Operator.Empty) {
                return
                    _result(
                        data.length == 0 ? Status.Ok : Status.CalldataNotEmpty,
                        condition,
                        payload,
                        consumptions
                    );
            } else if (operator == Operator.ArraySome) {
                return
                    _arraySome(data, condition, payload, consumptions, context);
            } else if (operator == Operator.ArrayEvery) {
                return
                    _arrayEvery(
                        data,
                        condition,
                        payload,
                        consumptions,
                        context
                    );
            } else {
                assert(operator == Operator.ArrayTailMatches);
                return
                    _arrayTailMatches(
                        data,
                        condition,
                        payload,
                        consumptions,
                        context
                    );
            }
        } else {
            if (operator <= Operator.LessThan) {
                return
                    _result(
                        _compare(data, condition, payload, context),
                        condition,
                        payload,
                        consumptions
                    );
            } else if (operator <= Operator.SignedIntLessThan) {
                return
                    _result(
                        _compareSignedInt(data, condition, payload, context),
                        condition,
                        payload,
                        consumptions
                    );
            } else if (operator == Operator.Bitmask) {
                return
                    _result(
                        BitmaskChecker.check(
                            data,
                            condition.compValue,
                            payload
                        ),
                        condition,
                        payload,
                        consumptions
                    );
            } else if (operator == Operator.WithinAllowance) {
                return
                    __allowance(
                        uint256(__input(data, payload, context)),
                        condition,
                        payload,
                        consumptions
                    );
            } else if (operator == Operator.CallWithinAllowance) {
                return __allowance(1, condition, payload, consumptions);
            } else if (operator == Operator.WithinRatio) {
                return
                    _result(
                        WithinRatioChecker.check(
                            condition.compValue,
                            context.pluckedValues
                        ),
                        condition,
                        payload,
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
                            payload.location,
                            payload.size,
                            context.pluckedValues
                        ),
                        condition,
                        payload,
                        consumptions
                    );
            }
        }
    }

    function _matches(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        uint256 shift = 32 - condition.compValue.length;
        if (shift < 32) {
            /*
             * Leading Bytes Validation
             *
             * For AbiEncoded + Matches, compValue might contain N bytes that must
             * match the first N bytes of calldata at payload.location.
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
            bytes32 actual = bytes32(data[payload.location:]) >> shift;

            if (expected != actual) {
                return
                    _violation(
                        Status.LeadingBytesNotAMatch,
                        condition,
                        payload,
                        consumptions
                    );
            }
        }

        uint256 sChildCount = condition.sChildCount;
        assert(sChildCount == payload.children.length);

        Payload memory emptyPayload;
        result.consumptions = consumptions;
        for (uint256 i; i < condition.children.length; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                i < sChildCount ? payload.children[i] : emptyPayload,
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
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        Payload memory emptyPayload;
        result.consumptions = consumptions;
        for (uint256 i; i < condition.children.length; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                i < condition.sChildCount
                    ? (payload.variant ? payload.children[i] : payload)
                    : emptyPayload,
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
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        Payload memory emptyPayload;
        for (uint256 i; i < condition.children.length; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                i < condition.sChildCount
                    ? (payload.variant ? payload.children[i] : payload)
                    : emptyPayload,
                consumptions,
                context
            );
            if (result.status == Status.Ok) {
                return result;
            }
        }

        return _violation(Status.OrViolation, condition, payload, consumptions);
    }

    function _arraySome(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        uint256 length = payload.children.length;
        for (uint256 i; i < length; ++i) {
            result = evaluate(
                data,
                condition.children[0],
                payload.children[i],
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
                payload,
                consumptions
            );
    }

    function _arrayEvery(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = consumptions;
        for (uint256 i; i < payload.children.length; ++i) {
            result = evaluate(
                data,
                condition.children[0],
                payload.children[i],
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
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory result) {
        uint256 conditionCount = condition.children.length;
        uint256 childCount = payload.children.length;

        if (childCount < conditionCount) {
            return
                _violation(
                    Status.ParameterNotAMatch,
                    condition,
                    payload,
                    consumptions
                );
        }

        result.consumptions = consumptions;
        uint256 tailOffset = childCount - conditionCount;

        for (uint256 i; i < conditionCount; ++i) {
            result = evaluate(
                data,
                condition.children[i],
                payload.children[tailOffset + i],
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
     * Slice creates a new Payload that points to a byte-range within the
     * current payload, so the child transparently evaluates against that
     * slice.
     *
     * The child will read the slice via __input, which right-aligns values
     * <=32 bytes to match comparison compValue encoding.
     */
    function _slice(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Consumption[] memory consumptions,
        Context memory context
    ) private view returns (Result memory) {
        // compValue layout: | 2 bytes: shift | 1 byte: size (1-32)
        uint16 shift = uint16(bytes2(condition.compValue));
        uint8 size = uint8(condition.compValue[2]);

        // Create sliced payload pointing to the slice range
        Payload memory slicedPayload;
        slicedPayload.location =
            payload.location +
            (payload.inlined ? 0 : 32) +
            shift;
        slicedPayload.size = size;

        return
            evaluate(
                data,
                condition.children[0],
                slicedPayload,
                consumptions,
                context
            );
    }

    function _compare(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private pure returns (Status) {
        Operator operator = condition.operator;

        bytes32 compValue = condition.compValue.length > 32
            ? keccak256(condition.compValue)
            : bytes32(condition.compValue);
        bytes32 value = __input(data, payload, context);

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
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private pure returns (Status) {
        Operator operator = condition.operator;
        int256 compValue = int256(uint256(bytes32(condition.compValue)));
        int256 value = int256(uint256(__input(data, payload, context)));

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
        Payload memory payload,
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

        return _result(status, condition, payload, nextConsumptions);
    }

    /**
     * @dev Reads a value from calldata or from Transaction.value, right-aligning when needed.
     *      - payload.size == 0: returns context.value (ether amount)
     *      - payload.size <= 32: reads from calldata and right-aligns
     *      - payload.size > 32: returns keccak256 hash of the calldata slice
     *
     * @param data    The calldata to read from.
     * @param payload The payload specifying location and size.
     * @param context The execution context (for ether value).
     * @return result The value as bytes32, right-aligned or hashed.
     */
    function __input(
        bytes calldata data,
        Payload memory payload,
        Context memory context
    ) private pure returns (bytes32 result) {
        if (payload.size == 32) {
            assembly {
                result := calldataload(add(data.offset, mload(payload)))
            }
            return result;
        }

        uint256 size = payload.size;
        if (size == 0) {
            return bytes32(context.value);
        }

        uint256 location = payload.location;
        if (size < 32) {
            // Right-align
            return bytes32(data[location:]) >> ((32 - size) * 8);
        }

        return keccak256(data[location:location + size]);
    }

    function _result(
        Status status,
        Condition memory condition,
        Payload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Result memory) {
        return
            status == Status.Ok
                ? _ok(consumptions)
                : _violation(status, condition, payload, consumptions);
    }

    function _ok(
        Consumption[] memory consumptions
    ) private pure returns (Result memory) {
        return
            Result({
                status: Status.Ok,
                violatedNodeIndex: 0,
                payloadLocation: 0,
                payloadSize: 0,
                consumptions: consumptions
            });
    }

    function _violation(
        Status status,
        Condition memory condition,
        Payload memory payload,
        Consumption[] memory consumptions
    ) private pure returns (Result memory) {
        return
            Result({
                status: status,
                violatedNodeIndex: condition.index,
                payloadLocation: payload.location,
                payloadSize: payload.size,
                consumptions: consumptions
            });
    }
}
