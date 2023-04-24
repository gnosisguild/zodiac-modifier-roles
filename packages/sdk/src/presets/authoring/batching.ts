import { BytesLike } from "ethers"

import { ExecutionFlags, PresetAllowEntry, PresetCondition } from "../types"

import { ConditionFunction } from "./conditions/types"

type PartialPresetFullyClearedTarget = ExecutionFlags
type PartialPresetFunction = ({ selector: string } | { signature: string }) & {
  condition?: PresetCondition | ConditionFunction<BytesLike>
} & ExecutionFlags
type PartialPresetAllowEntry =
  | PartialPresetFullyClearedTarget
  | PartialPresetFunction

export const forAll = (
  targetAddresses: string[],
  allow: PartialPresetAllowEntry | PartialPresetAllowEntry[]
): PresetAllowEntry[] => {
  const allowArray = Array.isArray(allow) ? allow : [allow]
  return targetAddresses.flatMap((targetAddress) =>
    allowArray.map((allow) => ({ ...allow, targetAddress }))
  )
}
