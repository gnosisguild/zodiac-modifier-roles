import { Function } from "zodiac-roles-deployments"

import { normalizeCondition, subtractCondition } from "../condition"

/**
 * Subtracts right function from left function, returning only what's in left but not in right.
 *
 * @param left - The function to subtract from
 * @param right - The function to subtract
 *
 * @returns A new function with only the permissions that are in left but not in right
 *
 * @note undefined is returned if nothing remains in left
 *
 */
export function subtractFunction(
  left: Function,
  right: Function
): Function | undefined {
  invariant(left.selector == right.selector)

  // Both wildcarded: only execution options matter
  if (left.wildcarded && right.wildcarded) {
    return left.executionOptions === right.executionOptions ? undefined : left
  }

  // Left wildcarded, right conditional: left is more permissive
  if (left.wildcarded && !right.wildcarded) {
    return left
  }

  // Left conditional, right wildcarded: right covers everything
  if (!left.wildcarded && right.wildcarded) {
    return undefined
  }

  // Both must be conditional at this point
  invariant(
    !left.wildcarded &&
      !right.wildcarded &&
      !!left.condition &&
      !!right.condition
  )

  // Different execution options: no overlap
  if (left.executionOptions !== right.executionOptions) {
    return left
  }

  // Subtract conditions
  const condition = normalizeCondition(left.condition!)
  const fragment = normalizeCondition(right.condition!)
  const result = subtractCondition(condition, fragment)

  return result !== undefined
    ? {
        ...left,
        condition: normalizeCondition(result),
      }
    : undefined
}

function invariant(check: boolean) {
  if (!check) throw new Error("Invariant")
}
