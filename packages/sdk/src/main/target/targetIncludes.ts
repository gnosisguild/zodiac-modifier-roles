import { Clearance, ExecutionOptions, Target } from "zodiac-roles-deployments"

import { normalizeCondition, subtractCondition } from "./condition"

/**
 * Checks if one Target includes (supersedes or equals) another Target.
 *
 * @param p1 - The potentially broader permission
 * @param p2 - The permission to check if included in p1
 * @returns true if p1 includes p2, false otherwise
 *
 */
export function targetIncludes(left: Target, right: Target): boolean {
  if (!canSend(left) && canSend(right)) {
    return false
  }

  if (!canDelegateCall(left) && canDelegateCall(right)) {
    return false
  }

  if (isTargetAllowed(left)) {
    return true
  }

  if (isTargetAllowed(right)) {
    return false
  }

  // assert
  if (!isTargetScoped(left) || !isTargetScoped(right)) {
    throw new Error("Expected Both Scoped")
  }

  return right.functions.every((rf) => {
    const lf = left.functions.find((lf) => lf.selector == rf.selector)
    if (!lf) return false

    if (lf.wildcarded) {
      return true
    }

    if (rf.wildcarded) {
      return false
    }

    // assert
    if (!lf.condition || !rf.condition) {
      throw new Error("Expected Both Conditional")
    }

    const c1 = lf.condition!
    const c2 = rf.condition!

    /*
     * if we can subtract from the main condition, it means current
     * permission is at least a top level variant, and at most
     * matches the condition completely
     */
    const condition = normalizeCondition(c1)
    const fragment = normalizeCondition(c2)
    return subtractCondition(condition, fragment) !== condition
  })
}

function canSend({ executionOptions }: { executionOptions: ExecutionOptions }) {
  return (
    executionOptions == ExecutionOptions.Send ||
    executionOptions == ExecutionOptions.Both
  )
}

function canDelegateCall({
  executionOptions,
}: {
  executionOptions: ExecutionOptions
}) {
  return (
    executionOptions == ExecutionOptions.DelegateCall ||
    executionOptions == ExecutionOptions.Both
  )
}

function isTargetAllowed({ clearance }: { clearance: Clearance }): boolean {
  return clearance == Clearance.Target
}

function isTargetScoped({ clearance }: { clearance: Clearance }): boolean {
  return clearance == Clearance.Function
}
