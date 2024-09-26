import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { conditionId as calculateConditionId } from "./conditionId"

export type NormalizedCondition = Omit<Condition, "children"> & {
  /**
   * A unique ID that is derived from the normalized condition content.
   * As such it's useful for comparing conditions for equality.
   *
   * **Important: Whenever a condition is updated, its `$$id` field must be deleted.**
   **/
  $$id: string
  children?: NormalizedCondition[]
}

/**
 * Transforms the structure of a condition without changing it semantics. Aims to minimize the tree size and to arrive at a normal form, so that semantically equivalent conditions will have an equal representation.
 * Such a normal form is useful for efficiently comparing conditions for equality. It is also promotes efficient, globally deduplicated storage of conditions since the Roles contract stores conditions in bytecode at addresses derived by hashing the condition data.
 **/
export const normalizeCondition = (
  condition: Condition | NormalizedCondition
): NormalizedCondition => {
  if (isNormalized(condition)) return condition

  // Processing starts at the leaves and works up, meaning that the individual normalization functions can rely on the current node's children being normalized.
  let result: NormalizedCondition = {
    $$id: "", // we'll set if after passing all normalization steps
    ...condition,
    children: condition.children?.map(normalizeCondition),
  }

  // At this point result is already a deep clone of the input condition, so the individual normalization functions can safely mutate it in place.
  result = collapseStaticTupleTypeTrees(result)
  result = pruneTrailingPass(result)
  result = flattenNestedLogicalConditions(result)
  result = dedupeBranches(result)
  result = unwrapSingleBranches(result)
  result = deleteUndefinedFields(result)
  result = pushDownLogicalConditions(result)
  result = normalizeChildrenOrder(result)

  addId(result)
  return result
}

export const isNormalized = (
  condition: Condition
): condition is NormalizedCondition => "$$id" in condition && !!condition.$$id

const addId = (condition: NormalizedCondition) => {
  condition.$$id = calculateConditionId(condition)
  return condition
}

export const stripIds = (condition: NormalizedCondition): Condition => {
  const { $$id, children, ...rest } = condition
  if (!children) return rest
  return {
    ...rest,
    children: children.map(stripIds),
  }
}

/** collapse condition subtrees unnecessarily describing static tuple structures */
const collapseStaticTupleTypeTrees = (
  condition: NormalizedCondition
): NormalizedCondition => {
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
        ? addId({
            $$id: "",
            paramType: ParameterType.Static,
            operator: condition.operator,
            compValue: condition.compValue,
          })
        : condition
    }
  }

  return condition
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

  // Start from the end and prune all trailing Pass nodes.
  // Always keep the first child, even if it is a Pass, because children must not be empty.
  // For tuples keep all children up to the first dynamic child.
  let keepChildrenUntil = 0
  if (isDynamicTuple) {
    keepChildrenUntil = condition.children.findIndex(isDynamicParamType)
  }
  let prunedChildren: NormalizedCondition[] = condition.children.slice(
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

  condition.children = prunedChildren
  return condition
}

/** flatten nested AND/OR conditions */
const flattenNestedLogicalConditions = (
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
const unwrapSingleBranches = (
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
const normalizeChildrenOrder = (
  condition: NormalizedCondition
): NormalizedCondition => {
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

/** push AND and OR conditions as far down the tree as possible without changing semantics */
const pushDownLogicalConditions = (
  condition: NormalizedCondition
): NormalizedCondition => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or
  ) {
    if (!condition.children?.length) return condition
    // we should at least have two branches since this function runs after `unwrapSingleBranches()`
    if (condition.children.length === 1) throw new Error("invariant violation")

    const [first, ...others] = condition.children

    // bail on mixed expression types
    if (!others.every((o) => o.operator === first.operator)) {
      return condition
    }

    let updatedCondition: NormalizedCondition | null = null
    if (first.operator === Operator.Matches) {
      let hingeIndex: number | null = null
      try {
        hingeIndex = findMatchesHingeIndex(condition.children)
      } catch (e) {
        console.error(e)
      }
      if (hingeIndex === null) return condition

      const children = first.children?.map((child, i) =>
        i !== hingeIndex
          ? child
          : {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: condition.children?.map((c) => c.children?.[i]),
            }
      )

      // TODO If any child has an `undefined` OR branch, we should replace the entire OR expression with a PASS
      // How do we get the correct type tree into the PASS expression?
      if (
        children?.some((child) => child.children?.some((c) => c === undefined))
      ) {
        throw new Error(
          "This case has not been implemented yet. Please report this issue at https://github.com/gnosisguild/zodiac-modifier-roles/issues"
        )
      }

      updatedCondition = {
        ...first,
        children: children as NormalizedCondition[],
      }
    }

    if (first.operator === Operator.And) {
      const hingeIndices = findAndHingeIndices(condition.children)
      if (hingeIndices === null) return condition

      // -1 means the respective AND conditions has all branches in common with the other AND conditions.
      // This means makes the OR branch pass independently of any of the unique branches of the other ANDs.
      // So we can get rid of the OR entirely.
      const canGetRidOfOr = hingeIndices.includes(-1)

      const orBranches = condition.children.map((child, i) => {
        const hingeIndex = hingeIndices[i]
        return child.children![hingeIndex]
      })

      updatedCondition = {
        ...first,
        children: [
          ...(first.children || []).filter((_, i) => hingeIndices[0] !== i),
          ...(canGetRidOfOr
            ? []
            : [
                {
                  $$id: "",
                  paramType: ParameterType.None,
                  operator: Operator.Or,
                  children: orBranches,
                },
              ]),
        ],
      }
    }

    // If we push down, we'll need to re-normalize the children
    // This will recursively further push down logical conditions as far as possible
    if (updatedCondition) {
      updatedCondition.$$id = "" // clear id to force re-normalization
      return normalizeCondition(updatedCondition)
    }
  }

  return condition
}

/**
 * Given a set of MATCHES conditions, check that their children are equal beyond a single hinge node.
 * @returns the index of the hinge node. If there are differences in more than a single index, returns `null`.
 * @throws If the conditions would not pass integrity checks.
 **/
const findMatchesHingeIndex = (conditions: readonly NormalizedCondition[]) => {
  // use first branch as reference and check if the others are equivalent beyond a single nested hinge node
  let hingeNodeIndex: number | null = null

  const [first, ...others] = conditions

  // empty matches does not make sense and would be rejected by the integrity check, bail
  if (!first.children) throw new Error("empty children")

  // all expressions must only differ in one child, the hinge node
  for (const other of others) {
    // empty matches does not make sense and would be rejected by the integrity check, bail
    if (!other.children) throw new Error("empty children")

    for (
      let i = 0;
      i < Math.max(first.children.length, other.children.length);
      i++
    ) {
      if (conditionsEqual(first.children[i], other.children[i])) {
        continue
      }

      if (hingeNodeIndex === null) {
        hingeNodeIndex = i
      }

      if (hingeNodeIndex !== i) {
        // difference in more than matches child
        return null
      }
    }
  }

  return hingeNodeIndex
}

/**
 * Given a set of AND conditions, check that their children are equal beyond a single hinge node in each branch. A hinge branch index of `-1` indicate a missing branch that is present in the other AND conditions.
 * @returns the indices of the hinge branches for the respective AND conditions. If there are differences in more than a single branch, returns `null`.
 **/
const findAndHingeIndices = (conditions: readonly NormalizedCondition[]) => {
  const allChildrenIds = conditions.map((condition) => {
    if (!condition.children) throw new Error("empty children")
    return condition.children.map((child) => child.$$id)
  })
  const allChildrenIdsSets = allChildrenIds.map((ids) => new Set(ids))

  const commonChildrenIds = intersection(...allChildrenIdsSets)
  const uniqueChildrenIds = allChildrenIdsSets.map((ids) =>
    difference(ids, commonChildrenIds)
  )

  if (!uniqueChildrenIds.every((ids) => ids.length <= 1)) {
    // differences in more than one branch
    return null
  }

  // TODO we're returning IDs but want indices
  return uniqueChildrenIds.map(([id], i) => allChildrenIds[i].indexOf(id))
}

const intersection = <T>(...sets: Set<T>[]) => {
  const [first, ...others] = sets
  return new Set(
    Array.from(first).filter((element) =>
      others.every((set) => set.has(element))
    )
  )
}

const difference = <T>(a: Set<T>, b: Set<T>) =>
  Array.from(a).filter((element) => !b.has(element))

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

const conditionsEqual = (
  a: NormalizedCondition | undefined,
  b: NormalizedCondition | undefined
) => (!a || a.$$id) === (!b || b.$$id)
