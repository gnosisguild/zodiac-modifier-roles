import { AbiCoder, ParamType } from "ethers"

export const encodeAbiParameters = (
  types: readonly (string | ParamType)[],
  values: readonly any[]
) => AbiCoder.defaultAbiCoder().encode(types, values) as `0x${string}`
