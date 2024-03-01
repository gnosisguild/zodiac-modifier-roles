import { Condition, Operator } from "../types"

import { conditionId } from "./conditionId"
import { normalizeCondition } from "./normalizeCondition"

/**
 * Given two conditions, split the first condition into two conditions, the given split condition and the remainder.
 * Both passed conditions are assumed to be in normal form.
 * @returns The remainder condition (normalized), or `undefined` if the split condition is equal to the combined condition.
 * @throws If the split condition is not a sub-condition of the combined condition.
 */
export const splitCondition = (
  combined: Condition,
  split: Condition
): Condition | undefined => {
  const result = splitConditionRecursive(combined, split)
  return result && normalizeCondition(result)
}

const splitConditionRecursive = (
  combined: Condition,
  split: Condition
): Condition | undefined => {
  if (conditionId(combined) === conditionId(split)) return undefined

  if (combined.operator === Operator.Or) {
    // potential splitting point
    const combinedChildrenIds = new Set(
      combined.children?.map(conditionId) || []
    )

    if (split.operator === Operator.Or) {
      // n:m OR split
      const splitChildrenIds = new Set(split.children?.map(conditionId) || [])
      if (
        new Set([...combinedChildrenIds, ...splitChildrenIds]).size !==
        combinedChildrenIds.size
      ) {
        throw new Error("inconsistent children")
      }

      const remainderChildren =
        combined.children?.filter(
          (child) => !splitChildrenIds.has(conditionId(child))
        ) || []

      if (!remainderChildren.length) return undefined

      return remainderChildren.length === 1
        ? remainderChildren[0]
        : {
            ...combined,
            children: remainderChildren,
          }
    } else {
      // n:1 OR split
      const splitConditionId = conditionId(split)
      if (!combinedChildrenIds.has(splitConditionId)) {
        throw new Error("inconsistent children")
      }

      const remainderChildren =
        combined.children?.filter(
          (child) => conditionId(child) !== splitConditionId
        ) || []

      if (!remainderChildren.length) return undefined

      return remainderChildren.length === 1
        ? remainderChildren[0]
        : {
            ...combined,
            children: remainderChildren,
          }
    }
  }

  if (combined.operator !== split.operator) {
    throw new Error("inconsistent operators")
  }
  if (combined.paramType !== split.paramType) {
    throw new Error("inconsistent param types")
  }
  if (combined.operator === Operator.Nor) {
    throw new Error("can not split sub-conditions of NOR")
  }
  if (!combined.children) {
    throw new Error("no children to split on")
  }

  // Process children of ANDs
  // They need to be equal or splittable
  if (combined.operator === Operator.And) {
    if (!combined.children || !split.children) {
      throw new Error("input conditions not normalized")
    }
    if (combined.children.length !== split.children.length) {
      throw new Error("inconsistent children")
    }

    // Combined and split conditions are both normalized, meaning children are ordered ny their condition ID.
    // They must differ in at most in one child, but this child will appear at different positions.
    const combinedChildrenIds = combined.children.map(conditionId)
    const splitChildrenIds = split.children.map(conditionId)
    const equalChildren = combined.children.filter((_, i) =>
      splitChildrenIds.includes(combinedChildrenIds[i])
    )
    if (equalChildren.length < combined.children.length - 1) {
      throw new Error("more than one AND branch differs")
    }

    const combinedChildIndex = combinedChildrenIds.findIndex(
      (id) => !splitChildrenIds.includes(id)
    )
    const splitChildIndex = splitChildrenIds.findIndex(
      (id) => !combinedChildrenIds.includes(id)
    )
    const remainderChild = splitCondition(
      combined.children[combinedChildIndex],
      split.children[splitChildIndex]
    )
    if (!remainderChild) throw new Error("invariant violation")

    return { ...combined, children: [...equalChildren, remainderChild] }
  }

  // Process all children of matches and array conditions
  // They need to be equal or splittable
  let didSplit = false
  const remainderChildren = combined.children.map((child, index) => {
    const splitChild = split.children && split.children[index]
    if (!splitChild) throw new Error("inconsistent children")
    if (conditionId(child) === conditionId(splitChild)) return child

    // Combined and split conditions are both normalized, meaning children will have the same order up to the first difference (i.e. the split child).
    if (didSplit) {
      throw new Error("more than one child differs")
    }
    const remainderChild = splitCondition(child, splitChild)
    if (!remainderChild) throw new Error("invariant violation")
    didSplit = true
    return remainderChild
  })

  if (!didSplit) {
    // no child to split on, but different condition IDs. this should never happen
    throw new Error("invariant violation")
  }

  return {
    ...combined,
    children: remainderChildren,
  }
}
