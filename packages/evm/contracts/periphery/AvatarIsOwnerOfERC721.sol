// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "./interfaces/ICustomCondition.sol";

interface IModifier {
    function avatar() external view returns (address);

    function target() external view returns (address);
}

contract AvatarIsOwnerOfERC721 is ICustomCondition {
    function check(
        address to,
        uint256 /* value */,
        bytes calldata data,
        Operation /* operation */,
        uint256 location,
        uint256 size,
        bytes calldata /* extra */,
        bytes32[] memory /* pluckedValues */
    ) public view returns (bool success, bytes32 reason) {
        address avatar = IModifier(msg.sender).avatar();
        uint256 tokenId = uint256(bytes32(data[location:location + size]));
        return (IERC721(to).ownerOf(tokenId) == avatar, 0);
    }
}
