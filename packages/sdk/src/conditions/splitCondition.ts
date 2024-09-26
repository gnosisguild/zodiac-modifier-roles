import { Condition, Operator } from "zodiac-roles-deployments"

import {
  normalizeCondition,
  NormalizedCondition,
  stripIds,
} from "./normalizeCondition"

/**
 * Given two conditions, split the first condition into two conditions, the given split condition and the remainder.
 * @returns The remainder condition (normalized), or `undefined` if the split condition is equal to the combined condition.
 * @throws If the split condition is not a sub-condition of the combined condition.
 */
export const splitCondition = (
  combined: Condition,
  split: Condition
): NormalizedCondition | undefined => {
  const combinedNormalized = normalizeCondition(combined)
  const splitNormalized = normalizeCondition(split)
  if (combinedNormalized.$$id === splitNormalized.$$id) return undefined

  if (combinedNormalized.operator === Operator.Or) {
    // potential splitting point
    const combinedChildrenIds = new Set(
      combinedNormalized.children?.map((c) => c.$$id) || []
    )

    if (splitNormalized.operator === Operator.Or) {
      // n:m OR split
      const splitChildrenIds = new Set(
        splitNormalized.children?.map((c) => c.$$id) || []
      )
      if (
        new Set([...combinedChildrenIds, ...splitChildrenIds]).size !==
        combinedChildrenIds.size
      ) {
        throw new Error("inconsistent children")
      }

      const remainderChildren =
        combinedNormalized.children?.filter(
          (child) => !splitChildrenIds.has(child.$$id)
        ) || []

      if (!remainderChildren.length) return undefined

      return remainderChildren.length === 1
        ? remainderChildren[0]
        : renormalize({
            ...combinedNormalized,
            children: remainderChildren,
          })
    } else {
      // n:1 OR split
      if (!combinedChildrenIds.has(splitNormalized.$$id)) {
        throw new Error("inconsistent children")
      }

      const remainderChildren =
        combinedNormalized.children?.filter(
          (child) => child.$$id !== splitNormalized.$$id
        ) || []

      if (!remainderChildren.length) return undefined

      return remainderChildren.length === 1
        ? remainderChildren[0]
        : renormalize({
            ...combinedNormalized,
            children: remainderChildren,
          })
    }
  }

  if (combinedNormalized.operator !== splitNormalized.operator) {
    throw new Error("inconsistent operators")
  }
  if (combinedNormalized.paramType !== splitNormalized.paramType) {
    throw new Error("inconsistent param types")
  }
  if (combinedNormalized.operator === Operator.Nor) {
    throw new Error("can not split sub-conditions of NOR")
  }
  if (!combinedNormalized.children) {
    throw new Error("no children to split on")
  }

  // Process children of ANDs
  // They need to be equal or splittable
  if (combinedNormalized.operator === Operator.And) {
    if (!combinedNormalized.children || !splitNormalized.children) {
      throw new Error("input conditions not normalized")
    }
    if (
      combinedNormalized.children.length !== splitNormalized.children.length
    ) {
      throw new Error("inconsistent children")
    }

    // Combined and split conditions are both normalized, meaning children are ordered ny their condition ID.
    // They must differ in at most in one child, but this child will appear at different positions.
    const combinedChildrenIds = combinedNormalized.children.map((c) => c.$$id)
    const splitChildrenIds = splitNormalized.children.map((c) => c.$$id)
    const equalChildren = combinedNormalized.children.filter((_, i) =>
      splitChildrenIds.includes(combinedChildrenIds[i])
    )
    if (equalChildren.length < combinedNormalized.children.length - 1) {
      throw new Error("more than one AND branch differs")
    }

    const combinedChildIndex = combinedChildrenIds.findIndex(
      (id) => !splitChildrenIds.includes(id)
    )
    const splitChildIndex = splitChildrenIds.findIndex(
      (id) => !combinedChildrenIds.includes(id)
    )
    const remainderChild = splitCondition(
      combinedNormalized.children[combinedChildIndex],
      splitNormalized.children[splitChildIndex]
    )
    if (!remainderChild) throw new Error("invariant violation")

    return renormalize({
      ...combinedNormalized,
      children: [...equalChildren, remainderChild],
    })
  }

  // Process all children of matches and array conditions
  // They need to be equal or splittable
  let didSplit = false
  const remainderChildren = combinedNormalized.children.map((child, index) => {
    const splitChild =
      splitNormalized.children && splitNormalized.children[index]
    if (!splitChild) throw new Error("inconsistent children")
    if (child.$$id === splitChild.$$id) return child

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

  return renormalize({
    ...combinedNormalized,
    children: remainderChildren,
  })
}

// When deriving an updated condition from a normalized condition, we need to re-normalize it.
// This is ensured by stripping out the now stale ID so normalizeCondition won't bail.
const renormalize = (condition: NormalizedCondition): NormalizedCondition =>
  normalizeCondition(stripIds(condition))
