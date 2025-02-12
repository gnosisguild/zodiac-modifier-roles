import { BytesLike } from "ethers"
import { Condition } from "zodiac-roles-deployments"

import { StatedPermission, ExecutionFlags } from "../types"

import { ConditionFunction } from "./conditions/types"

type UntargetedFunctionPermission = (
  | { selector: `0x${string}` }
  | { signature: string }
) & {
  condition?: Condition | ConditionFunction<BytesLike>
}
type UntargetedPermission = (UntargetedFunctionPermission | {}) & ExecutionFlags

export const forAll = (
  targetAddresses: readonly `0x${string}`[],
  allow: UntargetedPermission | UntargetedPermission[]
): StatedPermission[] => {
  const allowArray = Array.isArray(allow) ? allow : [allow]
  return targetAddresses.flatMap((targetAddress) =>
    allowArray.map((allow) => ({ ...allow, targetAddress }))
  )
}
