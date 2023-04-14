// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title Consumptions - a library that provides helper functions for dealing
 * with arrays of Consumption entries.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Consumptions {
    function clone(
        Consumption[] memory consumptions
    ) internal pure returns (Consumption[] memory result) {
        if (consumptions.length == 0) {
            return result;
        }

        uint256 length = consumptions.length;
        unchecked {
            result = new Consumption[](length);
            for (uint256 i; i < length; ++i) {
                result[i].allowanceKey = consumptions[i].allowanceKey;
                result[i].balance = consumptions[i].balance;
                result[i].consumed = consumptions[i].consumed;
            }
        }
    }

    function find(
        Consumption[] memory consumptions,
        bytes32 key
    ) internal pure returns (uint256, bool) {
        uint256 length = consumptions.length;
        unchecked {
            for (uint256 i; i < length; ++i) {
                if (consumptions[i].allowanceKey == key) {
                    return (i, true);
                }
            }
        }

        return (0, false);
    }

    function merge(
        Consumption[] memory c1,
        Consumption[] memory c2
    ) internal pure returns (Consumption[] memory result) {
        if (c1.length == 0) return c2;
        if (c2.length == 0) return c1;

        result = new Consumption[](c1.length + c2.length);

        uint256 length = c1.length;
        unchecked {
            for (uint256 i; i < length; ++i) {
                result[i].allowanceKey = c1[i].allowanceKey;
                result[i].balance = c1[i].balance;
                result[i].consumed = c1[i].consumed;
            }

            for (uint256 i; i < c2.length; ++i) {
                (uint256 index, bool found) = find(result, c2[i].allowanceKey);
                if (found) {
                    result[index].consumed += c2[i].consumed;
                } else {
                    result[length].allowanceKey = c2[i].allowanceKey;
                    result[length].balance = c2[i].balance;
                    result[length].consumed = c2[i].consumed;
                    length++;
                }
            }
        }

        if (length < result.length) {
            assembly {
                mstore(result, length)
            }
        }
    }
}
