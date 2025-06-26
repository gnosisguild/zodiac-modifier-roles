import { Condition, Operator } from "zodiac-roles-deployments"
import { rawConditionId as conditionId } from "./conditionId"

/*
  1. Exact match check  
  - If they're identical, nothing remains after subtraction

  2. OR operator handling
  This handles two cases:
  Case A: n:m OR split (both are ORs)
  // Example: OR(A,B,C) - OR(B,C) = A
  - Checks that all split children exist in combined
  - Removes split children from combined
  - Returns remainder (unwrapping if single child)

  Case B: n:1 OR split (combined is OR, split is single)
  // Example: OR(A,B,C) - B = OR(A,C)
  - Checks split exists as child of combined OR
  - Removes that single child
  - Returns remainder (unwrapping if single child)

  3. Bail on mismatch
  - Ensures both have same operator and param type
  - can't split NOR

  4. AND operator handling
  For AND, you can't just remove parts. The logic:
  - Both must have same number of children
  - They can differ in at most ONE child position
  - Finds the differing children and recursively splits them
  - Returns AND with the equal children + the remainder from recursive split
  // Example: AND(A,OR(B,C)) - AND(A,B) = AND(A,C)
  //          The OR(B,C) - B = C part is done recursively

  5. MATCHES/Array handling
  Position-by-position processing:
  - Goes through each child position
  - If children match at position, keep as-is
  - If they differ, recursively split at that position
  - Only allows ONE position to differ (throws otherwise)
  // Example: MATCHES(C, OR(A,B), X) - MATCHES(C, A, X) = MATCHES(C, B, X)
*/

export function canSubtract(
  condition: Condition,
  fragment: Condition
): boolean {
  const result = subtractCondition(condition, fragment)
  return result !== condition
}

/**
 * Attempts to subtract a fragment from a condition tree.
 * Returns the remainder if subtraction is valid, otherwise returns the original condition.
 * Never throws - gracefully handles incompatible conditions.
 */
export function subtractCondition(
  condition: Condition,
  fragment: Condition
): Condition | undefined {
  if (conditionId(condition) === conditionId(fragment)) {
    return undefined
  }

  if (
    condition.operator === Operator.Or &&
    condition.children &&
    fragment.operator === Operator.Or &&
    fragment.children
  ) {
    return OR_n_m(condition, fragment)
  }

  if (condition.operator === Operator.Or) {
    return OR_n_1(condition, fragment)
  }

  const canProceed =
    condition.operator !== Operator.Nor &&
    condition.operator === fragment.operator &&
    condition.paramType === fragment.paramType &&
    matchingChildrenCount(condition, fragment)

  if (!canProceed) {
    return condition
  }

  // AND operator - special handling
  if (condition.operator === Operator.And) {
    return AND(condition, fragment)
  } else {
    return MATCHES(condition, fragment)
  }
}

function OR_n_m(condition: Condition, fragment: Condition) {
  const children = condition.children!
  const fragmentChildren = fragment.children!

  // Check if all fragment children exist in condition
  const conditionChildIds = new Set(children.map((c) => conditionId(c)))
  const allFragmentChildrenExist = fragmentChildren.every((child) =>
    conditionChildIds.has(conditionId(child))
  )
  if (!allFragmentChildrenExist) {
    return condition // Can't subtract - fragment not fully contained
  }
  // Remove fragment children from condition
  const fragmentChildIds = new Set(fragmentChildren.map((c) => conditionId(c)))
  const nextChildren = condition.children!.filter(
    (child) => !fragmentChildIds.has(conditionId(child))
  )

  // remove
  if (nextChildren.length === 0) return undefined
  // unwrap
  if (nextChildren.length === 1) return nextChildren[0]
  // filter
  return { ...condition, children: nextChildren }
}

function OR_n_1(condition: Condition, fragment: Condition) {
  const nextChildren = condition
    .children!.map((child) => subtractCondition(child, fragment))
    .filter((t) => !!t)

  if (shallowEquals(condition.children!, nextChildren)) {
    return condition // Fragment not in OR
  }

  // remove
  if (nextChildren.length === 0) return undefined
  // unwrap
  if (nextChildren.length === 1) return nextChildren[0]
  // filter
  return { ...condition, children: nextChildren }
}

function AND(condition: Condition, fragment: Condition) {
  const children = condition.children!
  const fragmentChildren = fragment.children!

  // For AND, we need all children to match except possibly one
  let differingPositions = 0
  let differingIndex = -1

  for (let i = 0; i < children.length; i++) {
    if (conditionId(children[i]) !== conditionId(fragmentChildren[i])) {
      differingPositions++
      differingIndex = i
    }
  }

  // Can only handle one differing position
  if (differingPositions !== 1) {
    return condition
  }

  // Try to subtract at the differing position
  const remainder = subtractCondition(
    children[differingIndex],
    fragmentChildren[differingIndex]
  )

  if (remainder === children[differingIndex]) {
    return condition // Couldn't subtract
  }

  if (remainder === undefined) {
    return condition // Would remove entire AND child - invalid
  }

  return {
    ...condition,
    children: children.map((child, index) =>
      index === differingIndex ? remainder : child
    ),
  }
}

function MATCHES(condition: Condition, fragment: Condition) {
  // MATCHES and Array operators - position by position
  let changes = 0
  const newChildren = condition.children!.map((child, index) => {
    const fragmentChild = fragment.children![index]

    if (conditionId(child) === conditionId(fragmentChild)) {
      return child
    }

    const remainder = subtractCondition(child, fragmentChild)

    // If couldn't subtract or would remove entirely, keep original
    if (remainder === child || remainder === undefined) {
      return child
    } else {
      changes++
      return remainder
    }
  })

  return changes == 1 ? { ...condition, children: newChildren } : condition
}

function shallowEquals<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function matchingChildrenCount<T>(a: Condition, b: Condition): boolean {
  return (
    Array.isArray(a.children) &&
    Array.isArray(b.children) &&
    a.children.length > 0 &&
    a.children.length == b.children.length
  )
}
