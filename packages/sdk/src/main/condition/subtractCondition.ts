import { Condition, Operator } from "zodiac-roles-deployments"
import { rawConditionId as conditionId } from "./conditionId"

/**
 * Attempts to subtract a fragment from a condition tree.
 *
 * Handles various structural cases (OR, AND, MATCHES) with custom logic:
 * - Exact match: returns undefined
 * - OR: removes matching children or single child
 * - AND: allows subtraction if exactly one child differs
 * - MATCHES: recursive, positional subtraction with at most one difference
 *
 * Returns the remainder if subtraction is valid.
 * If subtraction isn't possible, returns the original condition.
 * Never throws — safe to call on arbitrary inputs.
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

/**
 * Handles OR n:m subtraction.
 * Removes all fragment children from an OR condition if they exist.
 * - If all match: returns the remainder (or unwraps if 1 child remains).
 * - If not all fragment children are found: returns the original condition.
 */
function OR_n_m(condition: Condition, fragment: Condition) {
  const conditionChildren = condition.children!
  const fragmentChildren = fragment.children!

  // Ensure all fragment children exist in condition
  const conditionIds = new Set(conditionChildren.map(conditionId))
  const allExist = fragmentChildren.every((child) =>
    conditionIds.has(conditionId(child))
  )
  if (!allExist) return condition

  // Filter out fragment children
  const fragmentIds = new Set(fragmentChildren.map(conditionId))
  const remaining = conditionChildren.filter(
    (child) => !fragmentIds.has(conditionId(child))
  )

  // remove
  if (remaining.length === 0) return undefined
  // unwrap
  if (remaining.length === 1) return remaining[0]
  // filter
  return { ...condition, children: remaining }
}

function OR_n_1(condition: Condition, fragment: Condition) {
  const nextChildren = condition
    .children!.map((child) => subtractCondition(child, fragment))
    .filter((t) => !!t)

  // Fragment not in OR
  if (shallowEquals(condition.children!, nextChildren)) return condition

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

  // Find the single differing position (if any)
  let diffCount = 0
  let diffIndex = -1

  for (let i = 0; i < children.length; i++) {
    if (conditionId(children[i]) !== conditionId(fragmentChildren[i])) {
      diffCount++
      diffIndex = i
    }
  }

  // Only allow subtraction if exactly one child differs
  if (diffCount !== 1) return condition

  // Attempt to subtract at the differing position
  const remainder = subtractCondition(
    children[diffIndex],
    fragmentChildren[diffIndex]
  )

  // If subtraction failed or removed the entire child, bail
  if (!remainder || remainder === children[diffIndex]) return condition

  // Replace the differing child with the result of subtraction
  return {
    ...condition,
    children: children.map((child, index) =>
      index === diffIndex ? remainder : child
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
