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
  const result = [...permissions].sort(sort).reduce(reduce, {
    permissions: [],
    warnings: [],
    violations: [],
  } as Result)

  // if there are violations, don't output permissions or warnings
  return result.violations.length > 0
    ? { ...result, permissions: [], warnings: [] }
    : result
}

const reduce = (result: Result, next: PermissionCoerced): Result => {
  const violations: (string | null)[] = [...result.violations]
  const warnings: (string | null)[] = [...result.warnings]
  const permissions: PermissionCoerced[] = [...result.permissions]

  {
    const prev = permissions.find(
      (prev) =>
        isPermissionAllowed(prev) &&
        prev.targetAddress.toLowerCase() === next.targetAddress.toLowerCase()
    )

    if (prev) {
      //get error, get warning
      violations.push(getMergeViolation(prev, next))
      warnings.push(getMergeWarning(prev, next))
      return {
        violations: violations.filter(Boolean) as string[],
        warnings: warnings.filter(Boolean) as string[],
        permissions,
      }
    }
  }

  if (isPermissionScoped(next)) {
    const prev = permissions.find(
      (prev) =>
        isPermissionWildcarded(prev) && targetId(prev) === targetId(next)
    )
    if (prev) {
      violations.push(getMergeViolation(prev, next))
      warnings.push(getMergeWarning(prev, next))
      return {
        violations: violations.filter(Boolean) as string[],
        warnings: warnings.filter(Boolean) as string[],
        permissions,
      }
    }
  }

  if (isPermissionConditional(next)) {
    const prev = permissions.find(
      (prev) =>
        (isPermissionConditional(prev) && targetId(prev)) === targetId(next)
    )
    if (prev) {
      //get error, get warning

      violations.push(getMergeViolation(prev, next))
      warnings.push(getMergeWarning(prev, next))
      ;(prev as FunctionPermissionCoerced).condition = mergeConditions(
        prev as FunctionPermissionCoerced,
        next as FunctionPermissionCoerced
      )
      return {
        violations: violations.filter(Boolean) as string[],
        warnings: warnings.filter(Boolean) as string[],
        permissions,
      }
    }
  }

  return {
    permissions: [...permissions, next],
    violations: violations.filter(Boolean) as string[],
    warnings: warnings.filter(Boolean) as string[],
  }
}

const sort = (p1: PermissionCoerced, p2: PermissionCoerced) => {
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

const getMergeViolation = (
  prev: PermissionCoerced,
  next: PermissionCoerced
): string | null => {
  if (!matchesExecutionOptions(prev, next)) {
    return "TODO"
  }

  return null
}

const getMergeWarning = (
  p1: PermissionCoerced,
  p2: PermissionCoerced
): string | null => {
  const hasAllowed = isPermissionAllowed(p1) || isPermissionAllowed(p2)
  const hasWildcarded = isPermissionWildcarded(p1) || isPermissionWildcarded(p2)
  const hasConditional =
    isPermissionConditional(p1) || isPermissionConditional(p2)

  if (hasAllowed && hasWildcarded) {
    return "TODO"
  }

  if (hasAllowed && hasConditional) {
    return "TODO"
  }

  if (hasWildcarded && hasConditional) {
    return "TODO"
  }

  return null
}
