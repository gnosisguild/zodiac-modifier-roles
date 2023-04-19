import { BigNumber } from "ethers"

import { Condition, Operator, ParameterType } from "../types"

import { getConditionId } from "./getConditionId"

// maybe add bool formula minimization, for example move OR conditions as far down as possible, e.g.: or(and(a, b), and(a, c)) -> and(a, or(b, c))
export const normalizeCondition = (condition: Condition): Condition => {
  // Processing starts at the leaves and works up, meaning that the individual normalization functions can rely on the current node's children being normalized.
  const normalizedChildren = condition.children?.map(normalizeCondition)
  let result: Condition = normalizedChildren
    ? { ...condition, children: normalizedChildren }
    : condition
  result = collapseStaticComplexTypeTrees(result)
  result = pruneTrailingStaticPass(result)
  result = flattenNestedLogicalConditions(result)
  result = dedupeBranches(result)
  result = unwrapSingleBranches(result)
  result = normalizeChildrenOrder(result)
  return result
}

/** collapse condition subtrees unnecessarily describing static tuple/array structures */
const collapseStaticComplexTypeTrees = (condition: Condition): Condition => {
  if (
    condition.paramType === ParameterType.Array ||
    condition.paramType === ParameterType.Tuple
  ) {
    if (
      condition.operator === Operator.Pass ||
      condition.operator === Operator.EqualTo
    ) {
      if (!condition.children) return condition

      const isStaticComplexType = condition.children.every(
        (child) => child.paramType === ParameterType.Static
      )

      return isStaticComplexType
        ? {
            paramType: ParameterType.Static,
            operator: condition.operator,
            compValue: condition.compValue,
          }
        : condition
    }
  }

  return condition
}

/** removes trailing Static Pass nodes (they are useless) */
const pruneTrailingStaticPass = (condition: Condition): Condition => {
  if (!condition.children) return condition

  let breakPruning = false
  const prunedChildren = condition.children
    .reverse()
    .filter((child) => {
      if (breakPruning) return true
      if (
        child.operator !== Operator.Pass ||
        child.paramType !== ParameterType.Static
      ) {
        breakPruning = true
        return true
      }
      return false
    })
    .reverse()

  return prunedChildren.length === condition.children.length
    ? condition
    : { ...condition, children: prunedChildren }
}

/** flatten nested AND/OR conditions */
const flattenNestedLogicalConditions = (condition: Condition): Condition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or
  ) {
    if (!condition.children) return condition

    const flattenedChildren = condition.children.flatMap((child) =>
      child.operator === condition.operator ? child.children || [] : [child]
    )
    return {
      ...condition,
      children: flattenedChildren,
    }
  }

  return condition
}

/** remove duplicate child branches in AND/OR/NOR */
const dedupeBranches = (condition: Condition): Condition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor
  ) {
    const childIds = new Set()
    const uniqueChildren = condition.children?.filter((child) => {
      const childId = getConditionId(child, true)
      const isDuplicate = !childIds.has(childId)
      childIds.add(childId)
      return isDuplicate
    })

    return { ...condition, children: uniqueChildren }
  }

  return condition
}

/** remove AND/OR wrapping if they have only a single child */
const unwrapSingleBranches = (condition: Condition): Condition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or
  ) {
    return condition.children?.length === 1 ? condition.children[0] : condition
  }

  return condition
}

/** enforce a canonical order of AND/OR/NOR branches */
const normalizeChildrenOrder = (condition: Condition): Condition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor
  ) {
    if (!condition.children) return condition

    const pairs = condition.children.map(
      (child) => [BigNumber.from(getConditionId(child, true)), child] as const
    )
    // sort is in-place
    pairs.sort(([a], [b]) => (a.lt(b) ? -1 : 1))
    const orderedChildren = pairs.map(([, child]) => child)

    return {
      ...condition,
      children: orderedChildren,
    }
  }

  return condition
}
