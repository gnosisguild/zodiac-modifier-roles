import { TypedData, TypedDataDomain } from "abitype"
import { AbiCoder } from "ethers"

import { toAbiTypes } from "./toAbiTypes"

export function encodeAbiTypes({
  domain,
  types,
}: {
  domain?: TypedDataDomain
  types: TypedData
}) {
  const { typeTree, typeHashes } = toAbiTypes({ domain, types })
  return AbiCoder.defaultAbiCoder().encode(
    ["tuple(tuple(uint8,uint256[])[], bytes32[])"],
    [[typeTree.map((p) => [p._type, p.fields]), typeHashes]]
  ) as `0x${string}`
}
