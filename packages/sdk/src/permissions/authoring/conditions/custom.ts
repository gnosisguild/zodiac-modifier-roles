import { BigNumberish } from "ethers"
import { BytesLike, ParamType, getAddress, hexlify } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"

import { ConditionFunction } from "./types"

const AVATAR_IS_OWNER_OF_ERC_721_ADDRESS =
  "0x91B1bd7BCC5E623d5CE76b0152253499a9C819d1"

/**
 * Asserts that the value is scope represents an ERC721 token ID owned by the avatar.
 * Assumes that the call target is the ERC721 contract.
 */
export const avatarIsOwnerOfErc721: ConditionFunction<BigNumberish> = (
  abiType: ParamType
) => {
  if (abiType.type !== "uint256") {
    throw new Error(
      "`avatarIsOwnerOfErc721` is only supported for uint256 params"
    )
  }
  return {
    paramType: ParameterType.Static,
    operator: Operator.Custom,
    compValue: encodeCustomCompValue(AVATAR_IS_OWNER_OF_ERC_721_ADDRESS),
  }
}

const encodeCustomCompValue = (
  customConditionAddress: `0x${string}`,
  extra: BytesLike = "0x"
) => {
  const extraHex = hexlify(extra).slice(2)
  if (extraHex.length > 24) {
    // 12 bytes
    throw new Error("Extra data is too long")
  }
  return (getAddress(customConditionAddress).toLowerCase() +
    extraHex.padEnd(24, "0")) as `0x${string}`
}
