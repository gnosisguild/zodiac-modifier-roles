import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { conditionHash } from "./conditionId"

export type NormalizedCondition = Omit<Condition, "children"> & {
  $$id: string
  children?: NormalizedCondition[]
}

export const normalizeConditionNext = normalizeCondition

function normalizeCondition(
  condition: Condition | NormalizedCondition
): NormalizedCondition {
  let result: NormalizedCondition = {
    $$id: "",
    ...condition,
    children: condition.children?.map(normalizeCondition),
  }

  result = pruneTrailingPass(result)
  result = flattenNestedLogical(result)
  result = dedupeBranches(result)
  result = unwrapSingleBranch(result)
  result = deleteUndefinedFields(result)
  result = sortChildren(result)

  return {
    ...result,
    $$id: conditionHash(result),
  }
}

/** Removes trailing Pass nodes from Matches on Calldata, AbiEncoded, and dynamic tuples (as long as the tuple stays marked dynamic) */
const pruneTrailingPass = (
  condition: NormalizedCondition
): NormalizedCondition => {
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

  const isGlobalAllowance = (child: NormalizedCondition) =>
    child.operator === Operator.EtherWithinAllowance ||
    child.operator === Operator.CallWithinAllowance

  // keep all children nodes with ParameterType.None
  // (EtherWithinAllowance, CallWithinAllowance conditions appear as children of Calldata.Matches)
  const tailChildren = condition.children.filter(isGlobalAllowance)
  const prunableChildren = condition.children.filter(
    (child) => !isGlobalAllowance(child)
  )

  // Start from the end and prune all trailing Pass nodes.
  // Always keep the first child, even if it is a Pass, because children must not be empty.
  // For tuples keep all children up to the first dynamic child.
  let keepChildrenUntil = 0
  if (isDynamicTuple) {
    keepChildrenUntil = prunableChildren.findIndex(isDynamicParamType)
  }
  let prunedChildren: NormalizedCondition[] = prunableChildren.slice(
    0,
    keepChildrenUntil + 1
  )
  for (let i = prunableChildren.length - 1; i > keepChildrenUntil; i--) {
    const child = prunableChildren[i]
    if (child.operator !== Operator.Pass) {
      prunedChildren = prunableChildren.slice(0, i + 1)
      break
    }
  }

  condition.children = [...prunedChildren, ...tailChildren]
  return condition
}

/** flatten nested AND/OR conditions */
const flattenNestedLogical = (
  condition: NormalizedCondition
): NormalizedCondition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or
  ) {
    if (!condition.children) return condition

    const flattenedChildren = condition.children.flatMap((child) =>
      child.operator === condition.operator ? child.children || [] : [child]
    )
    condition.children = flattenedChildren
  }

  return condition
}

/**
 * Given a condition, returns a tree of Pass nodes that matches the structure of the type
 */
export const copyStructure = (condition: Condition): Condition => {
  // skip over logical conditions
  if (condition.paramType === ParameterType.None) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error("Logical condition must have at least one child")
    }
    return copyStructure(condition.children[0])
  }

  // handle array conditions
  if (condition.paramType === ParameterType.Array) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error("Array condition must have at least one child")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.Pass,
      children: [copyStructure(condition.children[0])],
    }
  }

  return {
    paramType: condition.paramType,
    operator: Operator.Pass,
    children: condition.children?.map(copyStructure),
  }
}

/** remove duplicate child branches in AND/OR/NOR */
const dedupeBranches = (
  condition: NormalizedCondition
): NormalizedCondition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor
  ) {
    const childIds = new Set()
    const uniqueChildren = condition.children?.filter((child) => {
      const isDuplicate = childIds.has(child.$$id)
      childIds.add(child.$$id)
      return !isDuplicate
    })

    condition.children = uniqueChildren
  }

  return condition
}

/** remove AND/OR wrapping if they have only a single child */
const unwrapSingleBranch = (
  condition: NormalizedCondition
): NormalizedCondition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or
  ) {
    return condition.children?.length === 1 ? condition.children[0] : condition
  }

  return condition
}

/** enforce a canonical order of AND/OR/NOR branches */
const sortChildren = (condition: NormalizedCondition): NormalizedCondition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor
  ) {
    if (!condition.children) return condition
    condition.children.sort((a, b) =>
      BigInt(a.$$id) < BigInt(b.$$id) ? -1 : 1
    )

    // in case of mixed-type children (dynamic & calldata/abiEncoded), those with children must come first
    const moveToFront = condition.children.filter(
      (child) =>
        child.paramType === ParameterType.Calldata ||
        child.paramType === ParameterType.AbiEncoded
    )
    condition.children = [
      ...moveToFront,
      ...condition.children.filter((c) => !moveToFront.includes(c)),
    ]
  }

  return condition
}

const deleteUndefinedFields = (
  condition: NormalizedCondition
): NormalizedCondition => {
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
