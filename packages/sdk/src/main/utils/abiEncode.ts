import { AbiCoder, ParamType } from "ethers"

export const abiEncode = (
  types: readonly (string | ParamType)[],
  values: readonly any[]
): `0x${string}` =>
  AbiCoder.defaultAbiCoder().encode(types, values) as `0x${string}`
