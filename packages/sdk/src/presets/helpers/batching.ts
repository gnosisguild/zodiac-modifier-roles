import { ExecutionFlags, PresetAllowEntry, PresetCondition } from "../types"

type PartialPresetFullyClearedTarget = ExecutionFlags
type PartialPresetFunction = ({ sighash: string } | { signature: string }) & {
  condition?: PresetCondition
} & ExecutionFlags

export const forAll = (
  targetAddresses: string[],
  allow:
    | PartialPresetFullyClearedTarget
    | PartialPresetFunction
    | (PartialPresetFullyClearedTarget | PartialPresetFunction)[]
): PresetAllowEntry[] => {
  const allowArray = Array.isArray(allow) ? allow : [allow]
  return targetAddresses.flatMap((targetAddress) =>
    allowArray.map((allow) => ({ ...allow, targetAddress }))
  )
}
