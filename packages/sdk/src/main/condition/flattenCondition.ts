import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

export interface ConditionFlat {
  parent: number
  paramType: ParameterType
  operator: Operator
  compValue?: string
}

/**
 * Flattens a condition with nested children conditions into a breadth-first, flat array of conditions with parent index references.
 */
export const flattenCondition = (root: Condition): ConditionFlat[] => {
  const result: ConditionFlat[] = []
  const queue = [{ condition: root, parent: 0 }]

  while (queue.length > 0) {
    const {
      condition: { children, ...conditionFlat },
      parent,
    } = queue.shift()!

    result.push({ ...conditionFlat, parent })
    const index = result.length - 1

    if (children) {
      for (const child of children) {
        queue.push({ condition: child, parent: index })
      }
    }
  }

  return result
}
