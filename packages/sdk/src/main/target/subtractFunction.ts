import { Function } from "zodiac-roles-deployments"

import { normalizeCondition, subtractCondition } from "../condition"

/**
 * Subtracts right target from left target, returning only what's in left but not in right.
 *
 * @param left - The target to subtract from
 * @param right - The target to subtract
 *
 * @returns A new target with only the permissions that are in left but not in right
 *
 * @note undefined is returned if nothing remains in left
 *
 */
export function subtractFunction(
  left: Function,
  right: Function
): Function | undefined {
  invariant(left.selector == right.selector)

  if (left.wildcarded && right.wildcarded) {
    return left.executionOptions === right.executionOptions ? undefined : left
  }

  if (left.wildcarded && !right.wildcarded) {
    return left
  }

  if (!left.wildcarded && right.wildcarded) {
    return undefined
  }

  invariant(
    !left.wildcarded &&
      !right.wildcarded &&
      !!left.condition &&
      !!right.condition
  )

  if (left.executionOptions !== right.executionOptions) {
    return left
  }

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
