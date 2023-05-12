// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title Consumptions - a library that provides helper functions for dealing
 * with collection of Consumptions.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Consumptions {
    function clone(
        Consumption[] memory consumptions
    ) internal pure returns (Consumption[] memory result) {
        uint256 length = consumptions.length;

        result = new Consumption[](length);
        for (uint256 i; i < length; ) {
            result[i].allowanceKey = consumptions[i].allowanceKey;
            result[i].balance = consumptions[i].balance;
            result[i].consumed = consumptions[i].consumed;

            unchecked {
                ++i;
            }
        }
    }

    function find(
        Consumption[] memory consumptions,
        bytes32 key
    ) internal pure returns (uint256, bool) {
        uint256 length = consumptions.length;

        for (uint256 i; i < length; ) {
            if (consumptions[i].allowanceKey == key) {
                return (i, true);
            }

            unchecked {
                ++i;
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

        for (uint256 i; i < length; ) {
            result[i].allowanceKey = c1[i].allowanceKey;
            result[i].balance = c1[i].balance;
            result[i].consumed = c1[i].consumed;

            unchecked {
                ++i;
            }
        }

        for (uint256 i; i < c2.length; ) {
            (uint256 index, bool found) = find(c1, c2[i].allowanceKey);
            if (found) {
                result[index].consumed += c2[i].consumed;
            } else {
                result[length].allowanceKey = c2[i].allowanceKey;
                result[length].balance = c2[i].balance;
                result[length].consumed = c2[i].consumed;
                length++;
            }

            unchecked {
                ++i;
            }
        }

        if (length < result.length) {
            assembly {
                mstore(result, length)
            }
        }
    }
}
