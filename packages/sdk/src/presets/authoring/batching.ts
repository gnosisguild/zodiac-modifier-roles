import { BytesLike } from "ethers"

import { Condition } from "../../types"
import { ExecutionFlags, PresetAllowEntry } from "../types"

import { ConditionFunction } from "./conditions/types"

type PartialPresetFullyClearedTarget = ExecutionFlags
type PartialPresetFunction = (
  | { selector: `0x${string}` }
  | { signature: string }
) & {
  condition?: Condition | ConditionFunction<BytesLike>
} & ExecutionFlags
type PartialPresetAllowEntry =
  | PartialPresetFullyClearedTarget
  | PartialPresetFunction

export const forAll = (
  targetAddresses: readonly `0x${string}`[],
  allow: PartialPresetAllowEntry | PartialPresetAllowEntry[]
): PresetAllowEntry[] => {
  const allowArray = Array.isArray(allow) ? allow : [allow]
  return targetAddresses.flatMap((targetAddress) =>
    allowArray.map((allow) => ({ ...allow, targetAddress }))
  )
}
