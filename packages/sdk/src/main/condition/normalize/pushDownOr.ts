import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { conditionId } from "../conditionId"

/** push AND and OR conditions as far down the tree as possible without changing semantics */
export function pushDownOr(
  condition: Condition,
  normalize: (c: Condition) => Condition = (c) => c
): Condition {
  if (condition.operator !== Operator.Or) {
    return condition
  }

  invariant(!!condition.children?.length && condition.children.length > 1)

  const children = condition.children!

  // bail on mixed param types
  if (new Set(children.map((c) => c.paramType)).size !== 1) {
    return condition
  }

  // does not support Array
  if (children.some(({ paramType }) => paramType == ParameterType.Array)) {
    return condition
  }

  const isAnd = children.every(({ operator: o }) => o === Operator.And)
  const isMatches = children.every(({ operator: o }) => o === Operator.Matches)

  // only support every operator either And or Matches. Bail on mix or mismatch
  if (!isAnd && !isMatches) {
    return condition
  }

  const [first] = children

  const nextChildren = isMatches
    ? matches(children as Condition[])
    : and(children as Condition[])

  return children === nextChildren
    ? condition
    : normalize({
        ...first,
        children: nextChildren,
      })
}

function matches(children: Condition[]): Condition[] {
  invariant(children.length > 1)

  const hingeIndex = findMatchesHingeIndex(children)
  if (hingeIndex === null) {
    return children
  }

  const [first] = children

  return first.children!.map((child, i) =>
    i !== hingeIndex
      ? child
      : {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: children.map((c) => c.children?.[i]),
        }
  ) as Condition[]
}

function and(children: Condition[]): Condition[] {
  invariant(children.length > 1)

  const hingeIndices = findAndHingeIndices(children)
  if (!hingeIndices) {
    return children
  }

  const [first] = children
  const [pivot] = hingeIndices

  return first.children!.map((child, i) =>
    i !== pivot
      ? child
      : {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: children.map(
            (child, j) => child.children![hingeIndices[j]]
          ),
        }
  ) as Condition[]
}

function findMatchesHingeIndex(conditions: readonly Condition[]) {
  invariant(conditions.length > 1)
  const [first, ...others] = conditions

  let hingeIndex: number | null = null
  // all expressions must only differ in one child, the hinge node
  for (const other of others) {
    invariant(!!first.children && first.children!.length > 0)
    invariant(!!other.children && other.children!.length > 0)
    const left = first.children!
    const right = other.children!
    const length = Math.max(left.length, right.length)

    for (let i = 0; i < length; i++) {
      if (conditionsEqual(left[i], right[i])) {
        continue
      }

      if (hingeIndex === null) {
        hingeIndex = i
      }

      // difference in more than one matches child
      if (hingeIndex !== i) {
        return null
      }
    }
  }

  return hingeIndex
}

function findAndHingeIndices(conditions: Condition[]) {
  invariant(conditions.length > 1)

  // Step 1: Extract children IDs from each condition
  const allChildrenIds = conditions.map((c) => c.children!.map(conditionId))
  const allChildrenIdSets = allChildrenIds.map((ids) => new Set(ids))

  // Step 2: Find the intersection (common children IDs)
  const [firstSet, ...restSets] = allChildrenIdSets
  const commonChildrenIds = new Set(
    Array.from(firstSet).filter((id) => restSets.every((set) => set.has(id)))
  )

  // Step 3: Compute unique IDs for each condition
  const uniqueChildrenIds = allChildrenIds.map((ids) =>
    ids.filter((id) => !commonChildrenIds.has(id))
  )

  // Step 4: Validate that each condition has at most one unique ID
  if (uniqueChildrenIds.some((ids) => ids.length > 1)) return null

  // Step 5: Map the unique IDs back to their original index, or -1 if none
  return uniqueChildrenIds.map((unique, i) =>
    unique.length === 0 ? -1 : allChildrenIds[i].indexOf(unique[0])
  )
}

function invariant(c: boolean) {
  if (!c) throw new Error("Invariant")
}

const conditionsEqual = (a: Condition | undefined, b: Condition | undefined) =>
  (!a || conditionId(a)) === (!b || conditionId(b))
