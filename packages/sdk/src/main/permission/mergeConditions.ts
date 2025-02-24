import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"
import { normalizeCondition } from "./normalizeCondition"

/**
 * @dev Merges two conditions using a logical OR, flattening nested OR conditions. If the conditions are equal, it will still create separate OR branches.
 * These will be pruned later in sanitizeCondition().
 */
export const mergeConditions = (a: Condition, b: Condition): Condition => {
  return trimIds(
    normalizeCondition({
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [a, b],
    })
  )
}

function trimIds(condition: any): Condition {
  const { $$id, children, ...rest } = condition
  return {
    ...rest,
    ...(children ? { children: children.map(trimIds) } : {}),
  }
}
