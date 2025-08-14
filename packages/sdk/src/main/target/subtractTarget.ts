import { Clearance, Target } from "zodiac-roles-deployments"
import { subtractFunction } from "./subtractFunction"

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
      left: f,
      right: right.functions.find(({ selector }) => f.selector === selector),
    }))
    /*
     * if no match is found, return left
     * otherwise return left - right
     */
    .map(({ left, right }) => (right ? subtractFunction(left, right) : left))
    .filter((f) => !!f)

  if (nextFunctions.length === 0) return undefined

  return shallowEquals(left.functions, nextFunctions)
    ? left
    : {
        ...left,
        functions: nextFunctions,
      }
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

function invariant(condition: boolean): asserts condition {
  if (!condition) {
    throw new Error("Invariant")
  }
}
