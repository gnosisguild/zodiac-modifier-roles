// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Types.sol";

/**
 * @title Consumptions - a library that provides helper functions for dealing
 * with arrays of Consumption entries.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.pm>
 */
library Consumptions {
    function clone(
        Consumption[] memory consumptions
    ) internal pure returns (Consumption[] memory result) {
        if (consumptions.length == 0) {
            return result;
        }

        uint256 length = consumptions.length;
        result = new Consumption[](length);
        for (uint256 i; i < length; ++i) {
            result[i].allowanceKey = consumptions[i].allowanceKey;
            result[i].balance = consumptions[i].balance;
        }
    }

    function find(
        Consumption[] memory consumptions,
        bytes32 key
    ) internal pure returns (uint256, bool) {
        uint256 length = consumptions.length;
        for (uint256 i; i < length; ++i) {
            if (consumptions[i].allowanceKey == key) {
                return (i, true);
            }
        }

        return (0, false);
    }

    function contains(
        Consumption[] memory consumptions,
        bytes32 key
    ) internal pure returns (bool) {
        uint256 length = consumptions.length;
        for (uint256 i; i < length; ++i) {
            if (consumptions[i].allowanceKey == key) {
                return true;
            }
        }

        return false;
    }

    function merge(
        Consumption[] memory c1,
        Consumption[] memory c2
    ) internal pure returns (Consumption[] memory result) {
        if (c1.length == 0) return c2;
        if (c2.length == 0) return c1;

        result = new Consumption[](c1.length + c2.length);

        for (uint256 i; i < c1.length; ++i) {
            result[i].allowanceKey = c1[i].allowanceKey;
            result[i].balance = c1[i].balance;
        }

        uint256 resultLength = c1.length;
        for (uint256 i; i < c2.length; ++i) {
            if (!contains(result, c2[i].allowanceKey)) {
                result[resultLength].allowanceKey = c2[i].allowanceKey;
                result[resultLength].balance = c2[i].balance;
                resultLength++;
            }
        }

        if (resultLength < result.length) {
            assembly {
                mstore(result, resultLength)
            }
        }
    }
}
