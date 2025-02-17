import { invariant } from "@epic-web/invariant"
import { mergeConditions } from "./mergeConditions"
import {
  isPermissionAllowed,
  isPermissionConditional,
  isPermissionScoped,
  isPermissionWildcarded,
  targetId,
} from "./utils"

import { PermissionCoerced, FunctionPermissionCoerced } from "./types"

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
  const result = [...permissions].sort(comparePermission).reduce(reduce, {
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
  const violations: (string | null)[] = [...result.violations]
  const warnings: (string | null)[] = [...result.warnings]
  const permissions: PermissionCoerced[] = [...result.permissions]

  const mergeEntries = (
    prev: PermissionCoerced,
    next: PermissionCoerced
  ): Result => {
    return {
      ...result,
      warnings: [...result.warnings, maybeMergeWarning(prev, next)].filter(
        Boolean
      ) as string[],
      violations: [
        ...result.violations,
        maybeMergeViolation(prev, next),
      ].filter(Boolean) as string[],
    }
  }

  {
    const match = permissions.find(
      (m) =>
        isPermissionAllowed(m) &&
        m.targetAddress.toLowerCase() === permission.targetAddress.toLowerCase()
    )

    if (match) {
      return mergeEntries(match, permission)
    }
  }

  if (isPermissionScoped(permission)) {
    const match = permissions.find(
      (m) => isPermissionWildcarded(m) && targetId(m) === targetId(permission)
    )
    if (match) {
      return mergeEntries(match, permission)
    }
  }

  if (isPermissionConditional(permission)) {
    const match = permissions.find(
      (m) =>
        (isPermissionConditional(m) && targetId(m)) === targetId(permission)
    ) as FunctionPermissionCoerced | undefined
    if (match) {
      match.condition = mergeConditions(match, permission)
      return mergeEntries(match, permission)
    }
  }

  return {
    permissions: [...permissions, permission],
    violations: violations.filter(Boolean) as string[],
    warnings: warnings.filter(Boolean) as string[],
  }
}

const comparePermission = (p1: PermissionCoerced, p2: PermissionCoerced) => {
  if (isPermissionAllowed(p1) && isPermissionScoped(p2)) return -1

  if (isPermissionWildcarded(p1) && isPermissionConditional(p2)) return -1

  return 0
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

const maybeMergeWarning = (
  p1: PermissionCoerced,
  p2: PermissionCoerced
): string | null => {
  invariant(comparePermission(p1, p2) <= 0, "Never happens")

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
  prev: PermissionCoerced,
  next: PermissionCoerced
): string | null => {
  // invariant(comparePermission(p1, p2) <= 0, "Never happens")
  if (!matchesExecutionOptions(prev, next)) {
    return "TODO"
  }

  return null
}
