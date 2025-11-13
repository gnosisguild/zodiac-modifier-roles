// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;
import "./Topology.sol";

/**
 * @title Integrity, A library that validates condition integrity, and
 * adherence to the expected input structure and rules.
 *
 * @author gnosisguild
 */
library Integrity {
    error UnsuitableRootNode();

    error NotBFS();

    error UnsuitableParameterType(uint256 index);

    error UnsuitableCompValue(uint256 index);

    error UnsupportedOperator(uint256 index);

    error UnsuitableParent(uint256 index);

    error UnsuitableChildCount(uint256 index);

    error UnsuitableChildTypeTree(uint256 index);

    error NonStructuralChildrenMustComeLast(uint256 index);

    function enforce(ConditionFlat[] memory conditions) internal pure {
        _root(conditions);
        _bfs(conditions);
        for (uint256 i = 0; i < conditions.length; ++i) {
            _node(conditions[i], i);
        }
        _parents(conditions);
        _children(conditions);
        _nonStructuralOrdering(conditions);
        _typeTree(conditions);

        if (Topology.typeTree(conditions, 0)._type != AbiType.Calldata) {
            revert UnsuitableRootNode();
        }
    }

    function _root(ConditionFlat[] memory conditions) private pure {
        uint256 count;

        for (uint256 i; i < conditions.length; ++i) {
            if (conditions[i].parent == i) ++count;
        }
        if (count != 1 || conditions[0].parent != 0) {
            revert UnsuitableRootNode();
        }
    }

    function _bfs(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;
        // check BFS
        for (uint256 i = 1; i < length; ++i) {
            if (conditions[i - 1].parent > conditions[i].parent) {
                revert NotBFS();
            }

            if (conditions[i].parent > i) {
                revert NotBFS();
            }
        }
    }

    function _node(ConditionFlat memory condition, uint256 index) private pure {
        Operator operator = condition.operator;
        AbiType _type = condition.paramType;
        bytes memory compValue = condition.compValue;
        if (operator == Operator.Pass) {
            if (condition.compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator >= Operator.And && operator <= Operator.Nor) {
            if (_type != AbiType.None) {
                revert UnsuitableParameterType(index);
            }
            if (condition.compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Matches) {
            if (
                _type != AbiType.Tuple &&
                _type != AbiType.Array &&
                _type != AbiType.Calldata &&
                _type != AbiType.AbiEncoded
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.ArraySome ||
            operator == Operator.ArrayEvery ||
            operator == Operator.ArraySubset
        ) {
            if (_type != AbiType.Array) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.EqualToAvatar) {
            if (_type != AbiType.Static) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.EqualTo) {
            if (
                _type != AbiType.Static &&
                _type != AbiType.Dynamic &&
                _type != AbiType.Tuple &&
                _type != AbiType.Array
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length == 0 || compValue.length % 32 != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.GreaterThan ||
            operator == Operator.LessThan ||
            operator == Operator.SignedIntGreaterThan ||
            operator == Operator.SignedIntLessThan
        ) {
            if (_type != AbiType.Static) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Bitmask) {
            if (_type != AbiType.Static && _type != AbiType.Dynamic) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.Custom) {
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == Operator.WithinAllowance) {
            if (_type != AbiType.Static) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == Operator.EtherWithinAllowance ||
            operator == Operator.CallWithinAllowance
        ) {
            if (_type != AbiType.None) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else {
            revert UnsupportedOperator(index);
        }
    }

    function _parents(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;

        for (uint256 i = 0; i < length; ++i) {
            if (
                (conditions[i].operator == Operator.EtherWithinAllowance ||
                    conditions[i].operator == Operator.CallWithinAllowance)
            ) {
                (
                    uint256 countCalldataNodes,
                    ,
                    uint256 countOtherNodes
                ) = _countParentNodes(conditions, i);

                if (countCalldataNodes != 1 || countOtherNodes > 0) {
                    revert UnsuitableParent(i);
                }
            }
        }
    }

    function _children(ConditionFlat[] memory conditions) private pure {
        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            (, uint256 childrenLength) = Topology.childBounds(conditions, i);

            if (condition.paramType == AbiType.None) {
                if (
                    (condition.operator == Operator.EtherWithinAllowance ||
                        condition.operator == Operator.CallWithinAllowance) &&
                    childrenLength != 0
                ) {
                    revert UnsuitableChildCount(i);
                }
                if (
                    (condition.operator >= Operator.And &&
                        condition.operator <= Operator.Nor)
                ) {
                    if (childrenLength == 0) {
                        revert UnsuitableChildCount(i);
                    }
                }
            } else if (
                condition.paramType == AbiType.Static ||
                condition.paramType == AbiType.Dynamic
            ) {
                if (childrenLength != 0) {
                    revert UnsuitableChildCount(i);
                }
            } else if (
                condition.paramType == AbiType.Tuple ||
                condition.paramType == AbiType.Calldata ||
                condition.paramType == AbiType.AbiEncoded
            ) {
                if (childrenLength == 0) {
                    revert UnsuitableChildCount(i);
                }
            } else {
                assert(condition.paramType == AbiType.Array);

                if (childrenLength == 0) {
                    revert UnsuitableChildCount(i);
                }

                if (
                    (condition.operator == Operator.ArraySome ||
                        condition.operator == Operator.ArrayEvery) &&
                    childrenLength != 1
                ) {
                    revert UnsuitableChildCount(i);
                } else if (
                    condition.operator == Operator.ArraySubset &&
                    childrenLength > 256
                ) {
                    revert UnsuitableChildCount(i);
                }
            }
        }
    }

    function _nonStructuralOrdering(
        ConditionFlat[] memory conditions
    ) private pure {
        for (uint256 i = 0; i < conditions.length; ++i) {
            (uint256 childrenStart, uint256 childrenLength) = Topology
                .childBounds(conditions, i);

            if (childrenLength == 0) continue;

            // Once we see a non-structural child, all remaining must be non-structural
            bool seenNonStructural = false;
            for (uint256 j = 0; j < childrenLength; j++) {
                uint256 childIndex = childrenStart + j;
                bool isNonStructural = _isNonStructural(conditions, childIndex);

                if (seenNonStructural && !isNonStructural) {
                    // Structural child found after non-structural child
                    revert NonStructuralChildrenMustComeLast(i);
                }

                if (isNonStructural) {
                    seenNonStructural = true;
                }
            }
        }
    }

    function _isNonStructural(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        // NonStructural if paramType is None and all descendants are None
        if (conditions[index].paramType != AbiType.None) {
            return false;
        }

        // Check all descendants recursively
        for (uint256 i = index + 1; i < conditions.length; i++) {
            if (conditions[i].parent == index) {
                if (!_isNonStructural(conditions, i)) {
                    return false;
                }
            } else if (conditions[i].parent > index) {
                break;
            }
        }

        return true;
    }

    function _typeTree(ConditionFlat[] memory conditions) private pure {
        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            if (
                ((condition.operator >= Operator.And &&
                    condition.operator <= Operator.Nor) ||
                    condition.paramType == AbiType.Array)
            ) {
                if (
                    !_isTypeMatch(conditions, i) &&
                    !_isTypeEquivalence(conditions, i)
                ) {
                    revert UnsuitableChildTypeTree(i);
                }
            }
        }
    }

    function _isTypeMatch(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        (uint256 childrenStart, uint256 childrenLength) = Topology.childBounds(
            conditions,
            index
        );

        if (childrenLength == 1) {
            return true;
        }

        bytes32 id = Topology.typeTreeId(conditions, childrenStart);
        for (uint256 i = 1; i < childrenLength; ++i) {
            if (id != Topology.typeTreeId(conditions, childrenStart + i))
                return false;
        }

        return true;
    }
    function _isTypeEquivalence(
        ConditionFlat[] memory conditions,
        uint256 index
    ) private pure returns (bool) {
        (uint256 childrenStart, uint256 childrenLength) = Topology.childBounds(
            conditions,
            index
        );

        for (uint256 i = 0; i < childrenLength; ++i) {
            AbiType _type = Topology
                .typeTree(conditions, childrenStart + i)
                ._type;
            if (
                _type != AbiType.Dynamic &&
                _type != AbiType.Calldata &&
                _type != AbiType.AbiEncoded
            ) {
                return false;
            }
        }
        return true;
    }

    function _countParentNodes(
        ConditionFlat[] memory conditions,
        uint256 i
    )
        private
        pure
        returns (
            uint256 countCalldata,
            uint256 countLogical,
            uint256 countOther
        )
    {
        for (uint256 j = conditions[i].parent; ; ) {
            bool isCalldata = conditions[j].paramType == AbiType.Calldata;
            bool isLogical = (conditions[j].operator >= Operator.And &&
                conditions[j].operator <= Operator.Nor);

            if (isCalldata) {
                ++countCalldata;
            }

            if (isLogical) {
                ++countLogical;
            }

            if (!isCalldata && !isLogical) {
                ++countOther;
            }

            if (j == 0) {
                break;
            }

            j = conditions[j].parent;
        }
    }
}
