import { ParamType, defaultAbiCoder } from "ethers/lib/utils"

export const encodeAbiParameters = (
  types: readonly (string | ParamType)[],
  values: readonly any[]
) => defaultAbiCoder.encode(types, values) as `0x${string}`
