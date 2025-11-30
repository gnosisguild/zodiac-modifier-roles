// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./WithinAllowanceChecker.sol";
import "./WithinRatioChecker.sol";

import "../../common/AbiDecoder.sol";
import "../../periphery/interfaces/ICustomCondition.sol";

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
        AuthorizationContext memory context
    ) internal view returns (AuthorizationResult memory) {
        Operator operator = condition.operator;
        if (payload.overflown) {
            return
                AuthorizationResult({
                    status: AuthorizationStatus.CalldataOverflow,
                    consumptions: context.consumptions,
                    info: bytes32(payload.location)
                });
        }

        if (operator < Operator.EqualTo) {
            if (operator == Operator.Pass) {
                return
                    AuthorizationResult({
                        status: AuthorizationStatus.Ok,
                        consumptions: context.consumptions,
                        info: 0
                    });
            } else if (operator == Operator.Matches) {
                return _matches(data, condition, payload, context);
            } else if (operator == Operator.And) {
                return _and(data, condition, payload, context);
            } else if (operator == Operator.Or) {
                return _or(data, condition, payload, context);
            } else if (operator == Operator.ArraySome) {
                return _arraySome(data, condition, payload, context);
            } else if (operator == Operator.ArrayEvery) {
                return _arrayEvery(data, condition, payload, context);
            } else {
                assert(operator == Operator.ArrayTailMatches);
                return _arrayTailMatches(data, condition, payload, context);
            }
        } else {
            if (operator <= Operator.LessThan) {
                return
                    AuthorizationResult({
                        status: _compare(data, condition, payload),
                        consumptions: context.consumptions,
                        info: 0
                    });
            } else if (operator <= Operator.SignedIntLessThan) {
                return
                    AuthorizationResult({
                        status: _compareSignedInt(data, condition, payload),
                        consumptions: context.consumptions,
                        info: 0
                    });
            } else if (operator == Operator.Bitmask) {
                return
                    AuthorizationResult({
                        status: _bitmask(data, condition, payload),
                        consumptions: context.consumptions,
                        info: 0
                    });
            } else if (operator == Operator.Custom) {
                return _custom(data, condition, payload, context);
            } else if (operator == Operator.WithinRatio) {
                return _withinRatio(data, condition, payload, context);
            } else if (operator == Operator.WithinAllowance) {
                return
                    __allowance(
                        uint256(AbiDecoder.word(data, payload.location)),
                        condition.compValue,
                        AuthorizationStatus.AllowanceExceeded,
                        context
                    );
            } else if (operator == Operator.EtherWithinAllowance) {
                return
                    __allowance(
                        context.call.value,
                        condition.compValue,
                        AuthorizationStatus.EtherAllowanceExceeded,
                        context
                    );
            } else {
                assert(operator == Operator.CallWithinAllowance);
                return
                    __allowance(
                        1,
                        condition.compValue,
                        AuthorizationStatus.CallAllowanceExceeded,
                        context
                    );
            }
        }
    }

    function _matches(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory result) {
        result.consumptions = context.consumptions;

        uint256 sChildCount = condition.sChildCount;
        if (sChildCount != payload.children.length) {
            result.status = AuthorizationStatus.ParameterNotAMatch;
            return result;
        }

        for (uint256 i; i < condition.children.length; ) {
            result = evaluate(
                data,
                condition.children[i],
                i < sChildCount ? payload.children[i] : payload,
                AuthorizationContext({
                    call: context.call,
                    consumptions: result.consumptions
                })
            );
            if (result.status != AuthorizationStatus.Ok) {
                result.consumptions = context.consumptions;
                return result;
            }
            unchecked {
                ++i;
            }
        }

        result.status = AuthorizationStatus.Ok;
        return result;
    }

    function _and(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < condition.children.length; ) {
            result = evaluate(
                data,
                condition.children[i],
                payload.variant ? payload.children[i] : payload,
                AuthorizationContext({
                    call: context.call,
                    consumptions: result.consumptions
                })
            );
            if (result.status != AuthorizationStatus.Ok) {
                result.consumptions = context.consumptions;
                return result;
            }
            unchecked {
                ++i;
            }
        }

        result.status = AuthorizationStatus.Ok;
        return result;
    }

    function _or(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < condition.children.length; ) {
            result = evaluate(
                data,
                condition.children[i],
                payload.variant ? payload.children[i] : payload,
                AuthorizationContext({
                    call: context.call,
                    consumptions: result.consumptions
                })
            );
            if (result.status == AuthorizationStatus.Ok) {
                return result;
            }
            unchecked {
                ++i;
            }
        }

        return
            AuthorizationResult({
                status: AuthorizationStatus.OrViolation,
                consumptions: context.consumptions,
                info: 0
            });
    }

    function _arraySome(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory result) {
        result.consumptions = context.consumptions;

        uint256 length = payload.children.length;
        for (uint256 i; i < length; ) {
            result = evaluate(
                data,
                condition.children[0],
                payload.children[i],
                AuthorizationContext({
                    call: context.call,
                    consumptions: result.consumptions
                })
            );
            if (result.status == AuthorizationStatus.Ok) {
                return result;
            }
            unchecked {
                ++i;
            }
        }
        return
            AuthorizationResult({
                status: AuthorizationStatus.NoArrayElementPasses,
                consumptions: context.consumptions,
                info: 0
            });
    }

    function _arrayEvery(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < payload.children.length; ) {
            result = evaluate(
                data,
                condition.children[0],
                payload.children[i],
                AuthorizationContext({
                    call: context.call,
                    consumptions: result.consumptions
                })
            );
            if (result.status != AuthorizationStatus.Ok) {
                return
                    AuthorizationResult({
                        status: AuthorizationStatus.NotEveryArrayElementPasses,
                        consumptions: context.consumptions,
                        info: 0
                    });
            }
            unchecked {
                ++i;
            }
        }
        result.status = AuthorizationStatus.Ok;
        return result;
    }

    function _arrayTailMatches(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory result) {
        result.consumptions = context.consumptions;

        uint256 conditionCount = condition.children.length;
        uint256 childCount = payload.children.length;

        if (childCount < conditionCount) {
            result.status = AuthorizationStatus.ParameterNotAMatch;
            return result;
        }

        uint256 tailOffset = childCount - conditionCount;

        for (uint256 i; i < conditionCount; ) {
            result = evaluate(
                data,
                condition.children[i],
                payload.children[tailOffset + i],
                AuthorizationContext({
                    call: context.call,
                    consumptions: result.consumptions
                })
            );
            if (result.status != AuthorizationStatus.Ok) {
                result.consumptions = context.consumptions;
                return result;
            }
            unchecked {
                ++i;
            }
        }

        result.status = AuthorizationStatus.Ok;
        return result;
    }

    function _compare(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload
    ) private pure returns (AuthorizationStatus) {
        Operator operator = condition.operator;
        bytes32 compValue = bytes32(condition.compValue);
        bytes32 value = operator == Operator.EqualTo
            ? keccak256(AbiDecoder.pluck(data, payload.location, payload.size))
            : AbiDecoder.word(data, payload.location);

        if (operator == Operator.EqualTo && value != compValue) {
            return AuthorizationStatus.ParameterNotAllowed;
        } else if (operator == Operator.GreaterThan && value <= compValue) {
            return AuthorizationStatus.ParameterLessThanAllowed;
        } else if (operator == Operator.LessThan && value >= compValue) {
            return AuthorizationStatus.ParameterGreaterThanAllowed;
        } else {
            return AuthorizationStatus.Ok;
        }
    }

    function _compareSignedInt(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload
    ) private pure returns (AuthorizationStatus) {
        Operator operator = condition.operator;
        int256 compValue = int256(uint256(bytes32(condition.compValue)));
        int256 value = int256(uint256(AbiDecoder.word(data, payload.location)));

        if (operator == Operator.SignedIntGreaterThan && value <= compValue) {
            return AuthorizationStatus.ParameterLessThanAllowed;
        } else if (
            operator == Operator.SignedIntLessThan && value >= compValue
        ) {
            return AuthorizationStatus.ParameterGreaterThanAllowed;
        } else {
            return AuthorizationStatus.Ok;
        }
    }

    /**
     * Applies a shift and bitmask on the payload bytes and compares the
     * result to the expected value. The shift offset, bitmask, and expected
     * value are specified in the compValue parameter, which is tightly
     * packed as follows:
     * <2 bytes shift offset><15 bytes bitmask><15 bytes expected value>
     */
    function _bitmask(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload
    ) private pure returns (AuthorizationStatus) {
        bytes32 compValue = bytes32(condition.compValue);
        bool isInline = payload.size == 32;
        bytes calldata value = AbiDecoder.pluck(
            data,
            payload.location + (isInline ? 0 : 32),
            payload.size - (isInline ? 0 : 32)
        );

        uint256 shift = uint16(bytes2(compValue));
        if (shift >= value.length) {
            return AuthorizationStatus.BitmaskOverflow;
        }

        bytes32 rinse = bytes15(0xffffffffffffffffffffffffffffff);
        bytes32 mask = (compValue << 16) & rinse;
        // while its necessary to apply the rinse to the mask its not strictly
        // necessary to do so for the expected value, since we get remaining
        // 15 bytes anyway (shifting the word by 17 bytes)
        bytes32 expected = (compValue << (16 + 15 * 8)) & rinse;
        bytes32 slice = bytes32(value[shift:]);

        return
            (slice & mask) == expected
                ? AuthorizationStatus.Ok
                : AuthorizationStatus.BitmaskNotAllowed;
    }

    function _custom(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory) {
        // 20 bytes on the left
        ICustomCondition adapter = ICustomCondition(
            address(bytes20(bytes32(condition.compValue)))
        );
        // 12 bytes on the right
        bytes12 extra = bytes12(uint96(uint256(bytes32(condition.compValue))));

        (bool success, bytes32 info) = adapter.check(
            context.call.to,
            context.call.value,
            data,
            context.call.operation,
            payload.location,
            payload.size,
            extra
        );
        return
            AuthorizationResult({
                status: success
                    ? AuthorizationStatus.Ok
                    : AuthorizationStatus.CustomConditionViolation,
                consumptions: context.consumptions,
                info: info
            });
    }

    function _withinRatio(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory) {
        AuthorizationStatus status = WithinRatioChecker.check(
            data,
            condition.compValue,
            payload
        );

        return
            AuthorizationResult({
                status: status,
                consumptions: context.consumptions,
                info: 0
            });
    }

    function __allowance(
        uint256 value,
        bytes memory compValue,
        AuthorizationStatus failureStatus,
        AuthorizationContext memory context
    ) private view returns (AuthorizationResult memory) {
        bytes32 allowanceKey = bytes32(compValue);

        (
            bool success,
            Consumption[] memory consumptions
        ) = WithinAllowanceChecker.check(
                context.consumptions,
                value,
                compValue
            );

        return
            AuthorizationResult({
                status: success ? AuthorizationStatus.Ok : failureStatus,
                consumptions: consumptions,
                info: success ? bytes32(0) : allowanceKey
            });
    }
}
