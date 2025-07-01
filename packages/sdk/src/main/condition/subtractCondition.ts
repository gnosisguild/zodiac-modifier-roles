import { Condition, Operator } from "zodiac-roles-deployments"
import { rawConditionId as conditionId } from "./conditionId"

/**
 * Removes an independently satisfiable path from a condition.
 *
 * This function removes any condition fragment that could independently make the
 * original condition evaluate to true (satisfiable). It works with conditions that
 * have been normalized (where ORs may have been pushed down) or in their original form.
 *
 * Conceptually, if you think of a condition as a set of independent paths that
 * can satisfy it, this function removes one such path:
 * - For `A OR B`, removing A leaves B (removing an explicit path)
 * - For `AND(X, OR(Y, Z))`, removing `AND(X, Y)` leaves `AND(X, Z)`
 *   (removing a path that was pushed down during normalization)
 *
 * The "single hinge" principle for AND/MATCHES:
 * These operators require exactly one position to differ between the condition
 * and fragment. This ensures we're removing a complete satisfiable path, not
 * a partial condition. Both AND and MATCHES enforce positional semantics.
 *
 * @param condition The condition to subtract from
 * @param fragment The satisfiable path to remove
 * @returns The remainder after removing the path, or undefined if nothing remains
 * @returns The original condition if the fragment isn't a valid satisfiable path
 *
 * @example
 * - `subtract(OR(A, B, C), B)` → `OR(A, C)`
 * - `subtract(AND(X, OR(Y, Z)), AND(X, Y))` → `AND(X, Z)`)
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
    return or_n_m(condition, fragment)
  }

  if (condition.operator === Operator.Or) {
    return or_n_1(condition, fragment)
  }

  const canProceed =
    condition.operator !== Operator.Nor &&
    condition.operator === fragment.operator &&
    condition.paramType === fragment.paramType &&
    matchingChildrenCount(condition, fragment)

  if (!canProceed) {
    return condition
  }

  // AND and MATCHES operators - both use positional semantics
  return and(condition, fragment)
}

/**
 * Handles OR n:m subtraction.
 * Removes all fragment children from an OR condition if they exist.
 * - If all match: returns the remainder (or unwraps if 1 child remains).
 * - If not all fragment children are found: returns the original condition.
 */
function or_n_m(condition: Condition, fragment: Condition) {
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

function or_n_1(condition: Condition, fragment: Condition) {
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

/**
 * Handles subtraction for operators with positional semantics (AND, MATCHES).
 * Both operators require exactly one position to differ (single hinge principle).
 */
function and(condition: Condition, fragment: Condition) {
  const children = condition.children!
  const fragmentChildren = fragment.children!

  // Find positions that differ and attempt subtraction
  let changeCount = 0
  let changedIndex = -1

  const newChildren = children.map((child, index) => {
    if (changeCount > 1) return child

    const fragmentChild = fragmentChildren[index]

    // Same child - no change needed
    if (conditionId(child) === conditionId(fragmentChild)) {
      return child
    }

    // Attempt subtraction at this position
    const remainder = subtractCondition(child, fragmentChild)

    // If subtraction succeeded and actually changed something
    if (remainder !== child && remainder !== undefined) {
      changeCount++
      changedIndex = index
      return remainder
    }

    return child
  })

  // Only allow exactly one position to change (single hinge principle)
  if (changeCount !== 1) return condition

  return {
    ...condition,
    children: newChildren,
  }
}

function shallowEquals<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function matchingChildrenCount(a: Condition, b: Condition): boolean {
  return (
    Array.isArray(a.children) &&
    Array.isArray(b.children) &&
    a.children.length > 0 &&
    a.children.length == b.children.length
  )
}
