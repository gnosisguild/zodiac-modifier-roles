import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

/**
 * @dev Merges two conditions using a logical OR, flattening nested OR conditions. If the conditions are equal, it will still create separate OR branches.
 * These will be pruned later in sanitizeCondition().
 */
export const mergeConditions = (a: Condition, b: Condition): Condition => {
  const aBranches = a.operator === Operator.Or ? a.children : [a]
  const bBranches = b.operator === Operator.Or ? b.children : [b]

  return {
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: [...(aBranches || []), ...(bBranches || [])],
  }
}
