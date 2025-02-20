import { mergeConditions } from "./mergeConditions"
import {
  isPermissionAllowed,
  isPermissionConditional,
  isPermissionWildcarded,
  targetId,
} from "./utils"

import { PermissionCoerced } from "./types"

/**
 * Merges permission entries that target the same destination (targetAddress + selector)
 *
 * Merging Rules (when ExecutionOptions match):
 * ┌──────────────┬──────────────┬─────────────────────────────────────┐
 * │ Permission A │ Permission B │               Result                │
 * ├──────────────┼──────────────┼─────────────────────────────────────┤
 * │ Allowed      │ Allowed      │ Merged as duplicate                 │
 * │ Allowed      │ Scoped       │ Merged as Allowed (with warning)    │
 * │ Wildcarded   │ Wildcarded   │ Merged as duplicate                 │
 * │ Wildcarded   │ Conditional  │ Merged as Wildcarded (with warning) │
 * │ Conditional  │ Conditional  │ Merged as Conditional (children OR) │
 * └──────────────┴──────────────┴─────────────────────────────────────┘
 *
 * Note: Matching Permissions with different ExecutionOptions always throw an error
 *
 * Permission Types:
 * Allowed     -> Clearance.Target
 * Wildcarded  -> Clearance.Function AND wildcarded == true AND condition == undefined
 * Conditional -> Clearance.Function AND wildcarded == false AND condition == defined
 * Scoped      -> wilcarded or conditional
 *
 */

type Result = {
  permissions: PermissionCoerced[]
  violations: string[]
  warnings: string[]
}

export function mergePermissions(
  permissions: readonly PermissionCoerced[]
): Result {
  const result = permissions.reduce(reduce, {
    permissions: [],
    warnings: [],
    violations: [],
  } as Result)

  // if there are violations, don't output permissions or warnings
  return result.violations.length > 0
    ? { ...result, permissions: [], warnings: [] }
    : result
}

const reduce = (result: Result, permission: PermissionCoerced): Result => {
  const match = result.permissions.find((match) =>
    isPermissionAllowed(match) || isPermissionAllowed(permission)
      ? match.targetAddress === permission.targetAddress
      : targetId(match) === targetId(permission)
  )
  if (match) {
    return {
      permissions: result.permissions.map((entry) =>
        entry == match ? mergeEntry(entry, permission) : entry
      ),
      warnings: [
        ...result.warnings,
        maybeMergeWarning(match, permission),
      ].filter(Boolean) as string[],
      violations: [
        ...result.violations,
        maybeMergeViolation(match, permission),
      ].filter(Boolean) as string[],
    }
  }

  return {
    ...result,
    permissions: [...result.permissions, permission],
  }
}

const mergeEntry = (p1: PermissionCoerced, p2: PermissionCoerced) => {
  if (
    "condition" in p1 &&
    !!p1.condition &&
    "condition" in p2 &&
    !!p2.condition
  ) {
    return {
      ...p1,
      condition: mergeConditions(p1.condition, p2.condition),
    }
  }

  return comparePermission(p1, p2) <= 0 ? p1 : p2
}

const comparePermission = (p1: PermissionCoerced, p2: PermissionCoerced) => {
  if (isPermissionAllowed(p1) && isPermissionAllowed(p2)) return 0
  if (isPermissionAllowed(p1) && isPermissionWildcarded(p2)) return -1
  if (isPermissionAllowed(p1) && isPermissionConditional(p2)) return -1

  if (isPermissionWildcarded(p1) && isPermissionAllowed(p2)) return 1
  if (isPermissionWildcarded(p1) && isPermissionWildcarded(p2)) return 0
  if (isPermissionWildcarded(p1) && isPermissionConditional(p2)) return -1

  // if (isPermissionConditional(p1) && isPermissionAllowed(p2)) return 1
  // if (isPermissionConditional(p1) && isPermissionWildcarded(p2)) return 1
  if (isPermissionConditional(p1) && isPermissionConditional(p2)) return 0
  return 1
}

const maybeMergeWarning = (
  p1: PermissionCoerced,
  p2: PermissionCoerced
): string | null => {
  ;[p1, p2] = comparePermission(p1, p2) <= 0 ? [p1, p2] : [p2, p1]

  if (isPermissionAllowed(p1) && isPermissionWildcarded(p2)) {
    return `Target ${targetId(p1)} is fully allowed, and then wildcarded at function level ${targetId(p2)}. It will be fully allowed.`
  }

  if (isPermissionAllowed(p1) && isPermissionConditional(p2)) {
    return `Target ${targetId(p1)} is fully allowed, and then allowed conditionally at function level ${targetId(p2)}. It will be fully allowed.`
  }

  if (isPermissionWildcarded(p1) && isPermissionConditional(p2)) {
    return `Function ${targetId(p1)} is first wildcarded and then allowed conditionally. It will be wildcarded at function level.`
  }

  return null
}

const maybeMergeViolation = (
  p1: PermissionCoerced,
  p2: PermissionCoerced
): string | null => {
  if (!matchesExecutionOptions(p1, p2)) {
    return `The following functions appear multiple times and cannot be merged: ${targetId(p1)}, ${targetId(p2)}. This might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
  }

  return null
}

const matchesExecutionOptions = (
  p1: PermissionCoerced,
  p2: PermissionCoerced
): boolean => {
  return (
    Boolean(p1.send) === Boolean(p2.send) &&
    Boolean(p1.delegatecall) === Boolean(p2.delegatecall)
  )
}
