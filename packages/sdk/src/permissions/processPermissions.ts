import {
  Annotation,
  Clearance,
  ExecutionOptions,
  Target,
} from "zodiac-roles-deployments"

import { normalizeCondition } from "../conditions"
import { groupBy } from "../utils/groupBy"

import { mergeFunctionPermissions } from "./mergeFunctionPermissions"
import { Permission, PermissionSet, StatedPermission } from "./types"
import {
  execOptions,
  targetId,
  isPermissionScoped,
  coercePermission,
} from "./utils"

/**
 * Processes permissions returning the resulting list of allowed targets. Merges permission entries addressing the same function and performs sanity checks.
 * @param input to process
 * @returns The resulting list of allowed targets
 */
export const processPermissions = (
  input: (StatedPermission | PermissionSet)[]
): { targets: Target[]; annotations: Annotation[] } => {
  const permissions = input.flat().map((a) => coercePermission(a))

  // first we merge permissions addressing the same target functions so every entry will be unique
  const mergedPermissions = mergeFunctionPermissions(permissions)
  sanityCheck(mergedPermissions)

  const permissionsAllowed = mergedPermissions.filter(
    (entry) => !("selector" in entry)
  )
  const permissionsScoped = mergedPermissions.filter(
    (entry) => "selector" in entry
  )

  const targetsAllowed = permissionsAllowed.map((permission) => ({
    address: permission.targetAddress.toLowerCase() as `0x${string}`,
    clearance: Clearance.Target,
    executionOptions: execOptions(permission),
    functions: [],
  }))

  const targetsScoped = Object.entries(
    groupBy(permissionsScoped, (entry) => entry.targetAddress)
  ).map(([targetAddress, permissions]) => ({
    address: targetAddress.toLowerCase() as `0x${string}`,
    clearance: Clearance.Function,
    executionOptions: ExecutionOptions.None,
    functions: permissions.map(({ selector, condition, ...rest }) => ({
      selector: selector!,
      executionOptions: execOptions(rest),
      wildcarded: !condition,
      condition: condition && normalizeCondition(condition),
    })),
  }))

  // collect all annotations
  const annotations = input
    .filter((p) => Array.isArray(p))
    .map((permissionSet) => permissionSet.annotation)
    .filter((annotation): annotation is Annotation => !!annotation)

  return {
    targets: [...targetsAllowed, ...targetsScoped],

    // make annotations unique
    annotations: annotations.filter(
      (annotation, i) =>
        annotations.findIndex((a) => a.uri === annotation.uri) === i
    ),
  }
}

const sanityCheck = (permissions: Permission[]) => {
  assertNoWildcardScopedIntersection(permissions)
  assertNoDuplicateAllowFunction(permissions)
  assertNoDuplicateAllowTarget(permissions)
}

const assertNoWildcardScopedIntersection = (permissions: Permission[]) => {
  const allowedTargets = permissions
    .filter((entry) => !isPermissionScoped(entry))
    .map((entry) => entry.targetAddress)

  const scopedTargets = new Set(
    permissions.filter(isPermissionScoped).map((entry) => entry.targetAddress)
  )

  const intersection = [
    ...new Set(allowedTargets.filter((x) => scopedTargets.has(x))),
  ]
  if (intersection.length > 0) {
    throw new Error(
      `An address can either be fully allowed or scoped to selected functions. The following addresses are both: ${intersection.join(
        ", "
      )}`
    )
  }
}

const assertNoDuplicateAllowFunction = (permissions: Permission[]) => {
  const scopedPermissions = permissions.filter(isPermissionScoped).map(targetId)

  const counts = scopedPermissions.reduce(
    (result, item) => ({ ...result, [item]: (result[item] || 0) + 1 }),
    {} as Record<string, number>
  )
  const duplicates = [
    ...new Set(scopedPermissions.filter((item) => counts[item] > 1)),
  ]

  if (duplicates.length > 0) {
    throw new Error(
      `The following functions appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}.\nThis might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
    )
  }
}

const assertNoDuplicateAllowTarget = (permissions: Permission[]) => {
  const allowedPermissions = permissions
    .filter((p) => !isPermissionScoped(p))
    .map(targetId)

  const counts = allowedPermissions.reduce(
    (result, item) => ({ ...result, [item]: (result[item] || 0) + 1 }),
    {} as Record<string, number>
  )
  const duplicates = [
    ...new Set(allowedPermissions.filter((item) => counts[item] > 1)),
  ]

  if (duplicates.length > 0) {
    throw new Error(
      `The following targets appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}.\nThis might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
    )
  }
}
