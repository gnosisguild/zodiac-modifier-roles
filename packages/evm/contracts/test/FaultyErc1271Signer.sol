// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

import "@gnosis.pm/zodiac/contracts/signature/IERC1271.sol";

contract FaultyErc1271Signer is IERC1271 {
    function isValidSignature(
        bytes32,
        bytes memory
    ) external pure override returns (bytes4) {
        assembly {
            mstore(0, shl(224, 0x1626ba7e))
            revert(0, 4)
        }
    }
}
