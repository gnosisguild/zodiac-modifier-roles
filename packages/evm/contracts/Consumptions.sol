// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title Consumptions - a library that provides helper functions for dealing
 * with arrays of Consumption entries.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 */
library Consumptions {
    function find(
        Consumption[] memory consumptions,
        bytes32 key
    ) public pure returns (uint256, bool) {
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

    function contains(
        Consumption[] memory consumptions,
        bytes32 key
    ) external pure returns (bool) {
        uint256 length = consumptions.length;
        for (uint256 i; i < length; ) {
            if (consumptions[i].allowanceKey == key) {
                return true;
            }

            unchecked {
                ++i;
            }
        }

        return false;
    }

    function merge(
        Consumption[] memory c1,
        Consumption[] memory c2
    ) external pure returns (Consumption[] memory result) {
        if (c1.length == 0) return c2;
        if (c2.length == 0) return c1;

        result = new Consumption[](c1.length + c2.length);

        for (uint256 i; i < c1.length; ++i) {
            result[i].allowanceKey = c1[i].allowanceKey;
            result[i].balance = c1[i].balance;
            result[i].consumed = c1[i].consumed;
        }

        uint256 resultLength = c1.length;
        for (uint256 i; i < c2.length; ++i) {
            (uint256 index, bool found) = find(result, c2[i].allowanceKey);
            if (!found) {
                index = resultLength;
                resultLength++;
            }

            result[index].allowanceKey = c2[i].allowanceKey;
            result[index].balance = c2[i].balance;
            result[index].consumed += c2[i].consumed;
        }

        if (resultLength < result.length) {
            assembly {
                mstore(result, resultLength)
            }
        }
    }
}
