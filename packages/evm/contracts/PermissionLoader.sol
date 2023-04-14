// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";
import "./Consumptions.sol";
import "./Core.sol";
import "./Topology.sol";
import "./WriteOnce.sol";

import "./packers/Packer.sol";

/**
 * @title PermissionLoader - a component of the Zodiac Roles Mod that handles
 * the writing and reading of permission data to and from storage.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */
abstract contract PermissionLoader is Core {
    function _store(
        Role storage role,
        bytes32 key,
        ConditionFlat[] memory conditions,
        ExecutionOptions options
    ) internal override {
        bytes memory buffer = Packer.pack(conditions);
        address pointer = WriteOnce.store(buffer);

        role.scopeConfig[key] = BufferPacker.packHeader(
            conditions.length,
            options,
            pointer
        );
    }

    function _load(
        Role storage role,
        bytes32 key
    )
        internal
        view
        override
        returns (Condition memory result, Consumption[] memory consumptions)
    {
        (uint256 count, address pointer) = BufferPacker.unpackHeader(
            role.scopeConfig[key]
        );
        bytes memory buffer = WriteOnce.load(pointer);
        (
            ConditionFlat[] memory conditionsFlat,
            bytes32[] memory compValues
        ) = BufferPacker.unpackBody(buffer, count);

        uint256 avatarCount;
        uint256 allowanceCount;
        unchecked {
            for (uint256 i; i < conditionsFlat.length; ++i) {
                Operator operator = conditionsFlat[i].operator;
                if (operator == Operator.EqualToAvatar) {
                    ++avatarCount;
                }
                if (operator >= Operator.WithinAllowance) {
                    ++allowanceCount;
                }
            }
        }

        if (avatarCount > 0) {
            _conditionsFlat(conditionsFlat, compValues);
        }

        if (allowanceCount > 0) {
            consumptions = _consumptions(
                conditionsFlat,
                compValues,
                allowanceCount
            );
        }

        _toTree(
            conditionsFlat,
            compValues,
            Topology.childrenBounds(conditionsFlat),
            0,
            result
        );
    }

    function _conditionsFlat(
        ConditionFlat[] memory conditionsFlat,
        bytes32[] memory compValues
    ) private view {
        uint256 length = conditionsFlat.length;
        unchecked {
            for (uint256 i; i < length; ++i) {
                if (conditionsFlat[i].operator == Operator.EqualToAvatar) {
                    conditionsFlat[i].operator = Operator.EqualTo;
                    compValues[i] = keccak256(abi.encode(avatar));
                }
            }
        }
    }

    function _toTree(
        ConditionFlat[] memory conditionsFlat,
        bytes32[] memory compValues,
        Topology.Bounds[] memory childrenBounds,
        uint256 index,
        Condition memory result
    ) private pure {
        unchecked {
            ConditionFlat memory conditionFlat = conditionsFlat[index];
            result.paramType = conditionFlat.paramType;
            result.operator = conditionFlat.operator;
            result.compValue = compValues[index];

            if (childrenBounds[index].length == 0) {
                return;
            }

            uint256 start = childrenBounds[index].start;
            uint256 count = childrenBounds[index].length;

            result.children = new Condition[](count);
            for (uint j; j < count; ++j) {
                _toTree(
                    conditionsFlat,
                    compValues,
                    childrenBounds,
                    start + j,
                    result.children[j]
                );
            }
        }
    }

    function _consumptions(
        ConditionFlat[] memory conditions,
        bytes32[] memory compValues,
        uint256 maxAllowanceCount
    ) private view returns (Consumption[] memory result) {
        uint256 count = conditions.length;
        result = new Consumption[](maxAllowanceCount);

        uint256 insert;
        unchecked {
            for (uint256 i; i < count; ++i) {
                if (conditions[i].operator < Operator.WithinAllowance) {
                    continue;
                }

                bytes32 key = compValues[i];
                (, bool contains) = Consumptions.find(result, key);
                if (contains) {
                    continue;
                }

                result[insert].allowanceKey = key;
                (result[insert].balance, ) = _accruedAllowance(
                    allowances[key],
                    block.timestamp
                );
                insert++;
            }
        }

        if (insert < maxAllowanceCount) {
            assembly {
                mstore(result, insert)
            }
        }
    }
}
