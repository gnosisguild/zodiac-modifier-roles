import { BigNumber } from "ethers"

import { Condition, Operator, ParameterType } from "../types"

import { conditionId } from "./conditionId"

/**
 * Transforms the structure of a condition without changing it semantics. Aims to minimize the tree size and to arrive at a normal form, so that semantically equivalent conditions will have an equal representation.
 * Such a normal form is useful for efficiently comparing conditions for equality. It is also promotes efficient, globally deduplicated storage of conditions since the Roles contract stores conditions in bytecode at addresses derived by hashing the condition data.
 **/
export const normalizeCondition = (condition: Condition): Condition => {
  // Processing starts at the leaves and works up, meaning that the individual normalization functions can rely on the current node's children being normalized.
  const normalizedChildren = condition.children?.map(normalizeCondition)
  let result: Condition = normalizedChildren
    ? { ...condition, children: normalizedChildren }
    : condition
  result = collapseStaticTupleTypeTrees(result)
  result = pushDownLogicalConditions(result)
  result = pruneTrailingPass(result)
  result = flattenNestedLogicalConditions(result)
  result = dedupeBranches(result)
  result = unwrapSingleBranches(result)
  result = normalizeChildrenOrder(result)
  result = deleteUndefinedFields(result)
  return result
}

/** collapse condition subtrees unnecessarily describing static tuple structures */
const collapseStaticTupleTypeTrees = (condition: Condition): Condition => {
  if (condition.paramType === ParameterType.Tuple) {
    if (
      condition.operator === Operator.Pass ||
      condition.operator === Operator.EqualTo
    ) {
      if (!condition.children) return condition

      const isStaticTuple = condition.children.every(
        (child) => child.paramType === ParameterType.Static
      )

      return isStaticTuple
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

/** Removes trailing Pass nodes from Matches on Calldata, AbiEncoded, and dynamic tuples (as long as the tuple stays marked dynamic) */
const pruneTrailingPass = (condition: Condition): Condition => {
  if (!condition.children) return condition
  if (condition.operator !== Operator.Matches) return condition

  const isDynamicTuple =
    condition.paramType === ParameterType.Tuple && isDynamicParamType(condition)

  // We must not apply this to static tuples since removing Static Pass nodes would cause word shifts in the encoding.
  const canPrune =
    condition.paramType === ParameterType.Calldata ||
    condition.paramType === ParameterType.AbiEncoded ||
    isDynamicTuple

  if (!canPrune) return condition

  // Start from the end and prune all trailing Pass nodes.
  // Always keep the first child, even if it is a Pass, because children must not be empty.
  // For tuples keep all children up to the first dynamic child.
  let keepChildrenUntil = 0
  if (isDynamicTuple) {
    keepChildrenUntil = condition.children.findIndex(isDynamicParamType)
  }
  let prunedChildren: Condition[] = condition.children.slice(
    0,
    keepChildrenUntil + 1
  )
  for (let i = condition.children.length - 1; i > keepChildrenUntil; i--) {
    const child = condition.children[i]
    if (child.operator !== Operator.Pass) {
      prunedChildren = condition.children.slice(0, i + 1)
      break
    }
  }

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
      const childId = conditionId(child)
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
      (child) => [BigNumber.from(conditionId(child)), child] as const
    )
    // sort is in-place
    pairs.sort(([a], [b]) => (a.lt(b) ? -1 : 1))
    let orderedChildren = pairs.map(([, child]) => child)

    // in case of mixed-type children (dynamic & calldata/abiEncoded), those with children must come first
    const moveToFront = orderedChildren.filter(
      (child) =>
        child.paramType === ParameterType.Calldata ||
        child.paramType === ParameterType.AbiEncoded
    )
    orderedChildren = [
      ...moveToFront,
      ...orderedChildren.filter((c) => !moveToFront.includes(c)),
    ]

    return {
      ...condition,
      children: orderedChildren,
    }
  }

  return condition
}

/** push AND and OR conditions as far down the tree as possible without changing semantics */
const pushDownLogicalConditions = (condition: Condition): Condition => {
  return condition
}

const deleteUndefinedFields = (condition: Condition): Condition => {
  if ("children" in condition && !condition.children) delete condition.children
  if ("compValue" in condition && !condition.compValue)
    delete condition.compValue
  return condition
}

const isDynamicParamType = (condition: Condition): boolean => {
  switch (condition.paramType) {
    case ParameterType.Static:
      return false
    case ParameterType.Dynamic:
    case ParameterType.Array:
      return true
    case ParameterType.Tuple:
    case ParameterType.Calldata:
    case ParameterType.AbiEncoded:
    case ParameterType.None:
      return condition.children?.some(isDynamicParamType) ?? false
    default:
      throw new Error(`Unknown paramType: ${condition.paramType}`)
  }
}
