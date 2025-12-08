// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./BitmaskChecker.sol";
import "./WithinAllowanceChecker.sol";
import "./WithinRatioChecker.sol";

import "../../common/AbiDecoder.sol";
import "../../periphery/interfaces/ICustomCondition.sol";

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
        Context memory context
    ) internal view returns (Result memory) {
        Operator operator = condition.operator;
        if (payload.overflown) {
            return
                Result({
                    status: Status.CalldataOverflow,
                    consumptions: context.consumptions,
                    info: bytes32(payload.location)
                });
        }

        if (operator < Operator.EqualTo) {
            if (operator == Operator.Pass) {
                return
                    Result({
                        status: Status.Ok,
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
                    Result({
                        status: _compare(data, condition, payload),
                        consumptions: context.consumptions,
                        info: 0
                    });
            } else if (operator <= Operator.SignedIntLessThan) {
                return
                    Result({
                        status: _compareSignedInt(data, condition, payload),
                        consumptions: context.consumptions,
                        info: 0
                    });
            } else if (operator == Operator.Bitmask) {
                return
                    Result({
                        status: BitmaskChecker.check(
                            data,
                            condition.compValue,
                            payload
                        ),
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
                        Status.AllowanceExceeded,
                        context
                    );
            } else if (operator == Operator.EtherWithinAllowance) {
                return
                    __allowance(
                        context.call.value,
                        condition.compValue,
                        Status.EtherAllowanceExceeded,
                        context
                    );
            } else {
                assert(operator == Operator.CallWithinAllowance);
                return
                    __allowance(
                        1,
                        condition.compValue,
                        Status.CallAllowanceExceeded,
                        context
                    );
            }
        }
    }

    function _matches(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = context.consumptions;

        uint256 sChildCount = condition.sChildCount;
        if (sChildCount != payload.children.length) {
            result.status = Status.ParameterNotAMatch;
            return result;
        }

        for (uint256 i; i < condition.children.length; ) {
            result = evaluate(
                data,
                condition.children[i],
                i < sChildCount ? payload.children[i] : payload,
                Context({call: context.call, consumptions: result.consumptions})
            );
            if (result.status != Status.Ok) {
                result.consumptions = context.consumptions;
                return result;
            }
            unchecked {
                ++i;
            }
        }

        result.status = Status.Ok;
        return result;
    }

    function _and(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < condition.children.length; ) {
            result = evaluate(
                data,
                condition.children[i],
                payload.variant ? payload.children[i] : payload,
                Context({call: context.call, consumptions: result.consumptions})
            );
            if (result.status != Status.Ok) {
                result.consumptions = context.consumptions;
                return result;
            }
            unchecked {
                ++i;
            }
        }

        result.status = Status.Ok;
        return result;
    }

    function _or(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < condition.children.length; ) {
            result = evaluate(
                data,
                condition.children[i],
                payload.variant ? payload.children[i] : payload,
                Context({call: context.call, consumptions: result.consumptions})
            );
            if (result.status == Status.Ok) {
                return result;
            }
            unchecked {
                ++i;
            }
        }

        return
            Result({
                status: Status.OrViolation,
                consumptions: context.consumptions,
                info: 0
            });
    }

    function _arraySome(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = context.consumptions;

        uint256 length = payload.children.length;
        for (uint256 i; i < length; ) {
            result = evaluate(
                data,
                condition.children[0],
                payload.children[i],
                Context({call: context.call, consumptions: result.consumptions})
            );
            if (result.status == Status.Ok) {
                return result;
            }
            unchecked {
                ++i;
            }
        }
        return
            Result({
                status: Status.NoArrayElementPasses,
                consumptions: context.consumptions,
                info: 0
            });
    }

    function _arrayEvery(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = context.consumptions;

        for (uint256 i; i < payload.children.length; ) {
            result = evaluate(
                data,
                condition.children[0],
                payload.children[i],
                Context({call: context.call, consumptions: result.consumptions})
            );
            if (result.status != Status.Ok) {
                return
                    Result({
                        status: Status.NotEveryArrayElementPasses,
                        consumptions: context.consumptions,
                        info: 0
                    });
            }
            unchecked {
                ++i;
            }
        }
        result.status = Status.Ok;
        return result;
    }

    function _arrayTailMatches(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory result) {
        result.consumptions = context.consumptions;

        uint256 conditionCount = condition.children.length;
        uint256 childCount = payload.children.length;

        if (childCount < conditionCount) {
            result.status = Status.ParameterNotAMatch;
            return result;
        }

        uint256 tailOffset = childCount - conditionCount;

        for (uint256 i; i < conditionCount; ) {
            result = evaluate(
                data,
                condition.children[i],
                payload.children[tailOffset + i],
                Context({call: context.call, consumptions: result.consumptions})
            );
            if (result.status != Status.Ok) {
                result.consumptions = context.consumptions;
                return result;
            }
            unchecked {
                ++i;
            }
        }

        result.status = Status.Ok;
        return result;
    }

    function _compare(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload
    ) private pure returns (Status) {
        Operator operator = condition.operator;
        bytes32 compValue = bytes32(condition.compValue);
        bytes32 value = operator == Operator.EqualTo
            ? keccak256(data[payload.location:payload.location + payload.size])
            : AbiDecoder.word(data, payload.location);

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
        Payload memory payload
    ) private pure returns (Status) {
        Operator operator = condition.operator;
        int256 compValue = int256(uint256(bytes32(condition.compValue)));
        int256 value = int256(uint256(AbiDecoder.word(data, payload.location)));

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

    function _custom(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory) {
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
            Result({
                status: success ? Status.Ok : Status.CustomConditionViolation,
                consumptions: context.consumptions,
                info: info
            });
    }

    function _withinRatio(
        bytes calldata data,
        Condition memory condition,
        Payload memory payload,
        Context memory context
    ) private view returns (Result memory) {
        Status status = WithinRatioChecker.check(
            data,
            condition.compValue,
            payload
        );

        return
            Result({
                status: status,
                consumptions: context.consumptions,
                info: 0
            });
    }

    function __allowance(
        uint256 value,
        bytes memory compValue,
        Status failureStatus,
        Context memory context
    ) private view returns (Result memory) {
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
            Result({
                status: success ? Status.Ok : failureStatus,
                consumptions: consumptions,
                info: success ? bytes32(0) : allowanceKey
            });
    }
}
