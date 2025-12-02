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
  const { layout, typeHashes } = toAbiTypes({ domain, types })
  return AbiCoder.defaultAbiCoder().encode(
    ["tuple(tuple(uint256,uint8)[], bytes32[])"],
    [[layout.map((p) => [p.parent, p.encoding]), typeHashes]]
  ) as `0x${string}`
}
