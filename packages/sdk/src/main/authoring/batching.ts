import { BytesLike } from "ethers"
import { Condition } from "zodiac-roles-deployments"

import { ExecutionFlags, Permission } from ".."

import { ConditionFunction } from "./conditions/types"

type UntargetedFunctionPermission = (
  | { selector: `0x${string}` }
  | { signature: string }
) & {
  condition?: Condition | ConditionFunction<BytesLike>
} & ExecutionFlags
type UntargetedPermission = ExecutionFlags | UntargetedFunctionPermission

export const forAll = (
  targetAddresses: readonly `0x${string}`[],
  allow: UntargetedPermission | UntargetedPermission[]
): Permission[] => {
  const allowArray = Array.isArray(allow) ? allow : [allow]
  return targetAddresses.flatMap((targetAddress) =>
    allowArray.map((allow) => ({ ...allow, targetAddress }))
  )
}
