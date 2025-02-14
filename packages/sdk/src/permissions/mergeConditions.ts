import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { targetId } from "./utils"

import { FunctionPermissionCoerced } from "./types"

/**
 * @dev Merges two conditions using a logical OR, flattening nested OR conditions. If the conditions are equal, it will still create separate OR branches.
 * These will be pruned later in sanitizeCondition().
 */
export const mergeConditions = (
  a: FunctionPermissionCoerced,
  b: FunctionPermissionCoerced
): Condition | undefined => {
  if (!!a.condition !== !!b.condition) {
    const id = targetId(a)
    console.warn(
      `Target ${id} is allowed with and without conditions. It will be allowed without conditions.`
    )
    return undefined
  }

  if (!a.condition || !b.condition) return undefined

  const aBranches =
    a.condition.operator === Operator.Or ? a.condition.children : [a.condition]
  const bBranches =
    b.condition.operator === Operator.Or ? b.condition.children : [b.condition]

  return {
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: [...(aBranches || []), ...(bBranches || [])],
  }
}
