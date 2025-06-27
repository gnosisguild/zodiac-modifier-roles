import { Clearance, Target, Function } from "zodiac-roles-deployments"

import { normalizeCondition, subtractCondition } from "./condition"

/**
 * Subtracts right target from left target, returning only what's in left but not in right.
 *
 * @param left - The target to subtract from
 * @param right - The target to subtract
 * @returns A new target with only the permissions that are in left but not in right
 */
export function subtractTarget(
  left: Target,
  right: Target
): Target | undefined {
  invariant(
    left.address === right.address &&
      (isTargetAllowed(left) || isTargetScoped(left)) &&
      (isTargetAllowed(right) || isTargetScoped(right))
  )

  if (isTargetAllowed(left) && isTargetAllowed(right)) {
    return left.executionOptions === right.executionOptions ? undefined : left
  }

  if (isTargetAllowed(left) && isTargetScoped(right)) {
    return left
  }

  if (isTargetScoped(left) && isTargetAllowed(right)) {
    return undefined
  }

  invariant(isTargetScoped(left) && isTargetScoped(right))

  const nextFunctions = left.functions
    .map((f) => ({
      a: f,
      b: right.functions.find(({ selector }) => f.selector === selector),
    }))
    /*
     * if no match is found, return left
     * otherwise return left - right
     */
    .map(({ a, b }) => (b ? subtractFunction(a, b) : a))
    .filter((f) => !!f)

  if (nextFunctions.length === 0) return undefined

  return shallowEquals(left.functions, nextFunctions)
    ? left
    : {
        ...left,
        functions: nextFunctions,
      }
}

function subtractFunction(
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

  // TODO check
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

function isTargetAllowed({ clearance }: { clearance: Clearance }): boolean {
  return clearance == Clearance.Target
}

function isTargetScoped({ clearance }: { clearance: Clearance }): boolean {
  return clearance == Clearance.Function
}

function shallowEquals<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function invariant(check: boolean) {
  if (!check) throw new Error("Invariant")
}
