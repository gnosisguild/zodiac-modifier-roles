import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { conditionId } from "../conditionId"

/** push OR conditions as far down the tree as possible without changing semantics */
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
          children: children.map((c) => c.children![hingeIndex]),
        }
  )
}

function and(children: Condition[]): Condition[] {
  invariant(children.length > 1)

  const hingeIndices = findAndHingeIndices(children)
  if (!hingeIndices) {
    return children
  }

  const [first] = children
  const [hingeIndex] = hingeIndices

  return first.children!.map((child, i) =>
    i !== hingeIndex
      ? child
      : {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: children.map(
            (child, j) => child.children![hingeIndices[j]]
          ),
        }
  )
}

/**
 * Finds the single position (hinge) where all MATCHES conditions differ.
 *
 * MATCHES operators use positional semantics - each child at position i must be
 * compared with the child at the same position i in other conditions. This is
 * because MATCHES represents structural pattern matching where order and position
 * are significant.
 *
 * The function enforces the "single hinge principle": exactly one position must
 * differ across all conditions for the OR to be pushed down. If differences
 * exist at multiple positions, the transformation cannot proceed.
 *
 * @param conditions Array of MATCHES conditions to analyze
 * @returns The index of the single differing position, or null if:
 *          - Multiple positions differ
 *          - No differences found
 *          - Length mismatches exist
 *
 * @example
 * MATCHES(1, 2, 3) and MATCHES(1, X, 3) -> returns 1 (middle position)
 * MATCHES(1, 2) and MATCHES(X, Y) -> returns null (multiple differences)
 */
function findMatchesHingeIndex(conditions: readonly Condition[]) {
  invariant(conditions.length > 1)
  const [first, ...others] = conditions
  invariant(!!first.children && first.children!.length > 0)
  const left = first.children!
  for (const other of others) {
    invariant(!!other.children && other.children!.length > 0)
  }

  let hingeIndex: number | null = null

  for (const other of others) {
    const right = other.children!
    const length = Math.max(left.length, right.length)

    for (let i = 0; i < length; i++) {
      if (conditionsEqual(left[i], right[i])) continue

      if (hingeIndex === null) {
        hingeIndex = i
      }

      if (hingeIndex !== i) {
        return null
      }
    }
  }

  return hingeIndex
}

/**
 * Finds the positions (hinges) where AND conditions differ using set-based comparison.
 *
 * AND operators use set-based semantics - elements can appear in any order within
 * each condition since AND is commutative (A ∧ B ≡ B ∧ A). This function compares
 * conditions by their content (condition IDs) rather than by position.
 *
 * The function enforces the "single hinge principle": exactly one element must
 * differ across all conditions for the OR to be pushed down. Unlike MATCHES,
 * the differing elements may appear at different positions in each condition.
 *
 * @param conditions Array of AND conditions to analyze
 * @returns Array of indices where each index represents the position of the
 *          unique element in that condition, or null if:
 *          - Multiple elements differ in any condition
 *          - No common elements exist across conditions
 *
 * @example
 * AND(A, B, C) and AND(C, A, X) -> returns [1, 2] (B at pos 1, X at pos 2)
 * AND(A, B, C) and AND(A, Y, Z) -> returns null (multiple differences)
 * AND(A, B) and AND(X, Y) -> returns null (no common element)
 *
 */
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
  if (!uniqueChildrenIds.every((ids) => ids.length === 1)) return null

  // Step 5: Map the unique IDs back to their original index, or -1 if none
  return uniqueChildrenIds.map((unique, i) =>
    unique.length === 0 ? -1 : allChildrenIds[i].indexOf(unique[0])
  )
}

const conditionsEqual = (a: Condition | undefined, b: Condition | undefined) =>
  (!a || conditionId(a)) === (!b || conditionId(b))

function invariant(c: boolean) {
  if (!c) throw new Error("Invariant")
}
